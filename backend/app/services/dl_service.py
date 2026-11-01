import time
import json
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple, List

# 1. Artificial Neural Network (ANN / MLP)
class ANNModel(nn.Module):
    def __init__(self, input_dim: int, num_classes: int, hidden_dim1: int = 128, hidden_dim2: int = 64, dropout: float = 0.2):
        super(ANNModel, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim1),
            nn.BatchNorm1d(hidden_dim1),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim1, hidden_dim2),
            nn.BatchNorm1d(hidden_dim2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim2, num_classes)
        )

    def forward(self, x):
        return self.net(x)

# 2. Sequential LSTM Model
# Justified sequence construction strategy:
# Network intrusion flows arrive in burst sequences (e.g. DoS bursts, port scan sweeps).
# We group consecutive flows into sliding temporal sequence windows of length `seq_len` (default 5).
class LSTMModel(nn.Module):
    def __init__(self, input_dim: int, num_classes: int, hidden_dim: int = 64, num_layers: int = 2, dropout: float = 0.2):
        super(LSTMModel, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        # x shape: (batch_size, seq_len, input_dim)
        out, (hn, cn) = self.lstm(x)
        # Use output from last time step
        last_out = out[:, -1, :]
        return self.fc(last_out)

class PyTorchModelWrapper:
    """Wrapper that exposes scikit-learn compatible predict and predict_proba methods."""
    def __init__(self, model: nn.Module, model_type: str, seq_len: int = 5, num_classes: int = 2):
        self.model = model
        self.model_type = model_type.upper()
        self.seq_len = seq_len
        self.num_classes = num_classes
        self.device = torch.device("cpu")
        self.model.to(self.device)
        self.model.eval()

    def _prepare_input(self, X: np.ndarray) -> torch.Tensor:
        if self.model_type in ["LSTM", "RNN"]:
            # If 2D array, construct sliding sequence windows
            if len(X.shape) == 2:
                N, D = X.shape
                # If N < seq_len, pad with zeros
                if N < self.seq_len:
                    padding = np.zeros((self.seq_len - N, D), dtype=X.dtype)
                    X_padded = np.vstack([padding, X])
                    seqs = [X_padded]
                else:
                    seqs = []
                    for i in range(N):
                        if i < self.seq_len - 1:
                            pad_count = self.seq_len - 1 - i
                            pad = np.repeat(X[0:1], pad_count, axis=0)
                            window = np.vstack([pad, X[:i + 1]])
                        else:
                            window = X[i - self.seq_len + 1 : i + 1]
                        seqs.append(window)
                return torch.tensor(np.array(seqs), dtype=torch.float32)
            else:
                return torch.tensor(X, dtype=torch.float32)
        else:
            return torch.tensor(X, dtype=torch.float32)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        self.model.eval()
        with torch.no_grad():
            tensor_x = self._prepare_input(X)
            # Batch inference to avoid memory spike
            probas = []
            loader = DataLoader(TensorDataset(tensor_x), batch_size=256, shuffle=False)
            for (batch_x,) in loader:
                batch_x = batch_x.to(self.device)
                logits = self.model(batch_x)
                p = torch.softmax(logits, dim=1).cpu().numpy()
                probas.append(p)
            return np.vstack(probas)

    def predict(self, X: np.ndarray) -> np.ndarray:
        probas = self.predict_proba(X)
        return np.argmax(probas, axis=1)

class DLService:
    @staticmethod
    def train_model(
        model_type: str,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        class_weights: Dict[int, float] = None,
        hyperparameters: Dict[str, Any] = None
    ) -> Tuple[PyTorchModelWrapper, float, List[Dict[str, Any]]]:
        start_time = time.time()
        hyperparameters = hyperparameters or {}
        epochs = int(hyperparameters.get("epochs", 15))
        batch_size = int(hyperparameters.get("batch_size", 64))
        learning_rate = float(hyperparameters.get("learning_rate", 0.001))
        dropout = float(hyperparameters.get("dropout", 0.2))
        seq_len = int(hyperparameters.get("seq_len", 5))

        num_classes = len(np.unique(np.concatenate([y_train, y_val])))
        input_dim = X_train.shape[1]

        # Weights tensor for loss function
        weight_tensor = None
        if class_weights:
            w_list = [class_weights.get(i, 1.0) for i in range(num_classes)]
            weight_tensor = torch.tensor(w_list, dtype=torch.float32)

        criterion = nn.CrossEntropyLoss(weight=weight_tensor)

        # Prepare PyTorch datasets
        model_type_upper = model_type.upper()
        if model_type_upper == "LSTM":
            # Build sequence dataset for LSTM
            def make_sequences(X, y, slen):
                N = len(X)
                if N <= slen:
                    pad = np.zeros((slen - N + 1, X.shape[1]))
                    X_ext = np.vstack([pad, X])
                    y_ext = np.pad(y, (slen - N + 1, 0), mode='edge')
                else:
                    X_ext = X
                    y_ext = y
                seq_X, seq_y = [], []
                for i in range(len(X_ext) - slen + 1):
                    seq_X.append(X_ext[i : i + slen])
                    seq_y.append(y_ext[i + slen - 1])
                return np.array(seq_X, dtype=np.float32), np.array(seq_y, dtype=np.int64)

            X_tr_seq, y_tr_seq = make_sequences(X_train, y_train, seq_len)
            X_val_seq, y_val_seq = make_sequences(X_val, y_val, seq_len)

            train_dataset = TensorDataset(torch.tensor(X_tr_seq), torch.tensor(y_tr_seq))
            val_dataset = TensorDataset(torch.tensor(X_val_seq), torch.tensor(y_val_seq))
            model = LSTMModel(input_dim=input_dim, num_classes=num_classes, hidden_dim=64, dropout=dropout)
        else:
            train_dataset = TensorDataset(
                torch.tensor(X_train, dtype=torch.float32),
                torch.tensor(y_train, dtype=torch.int64)
            )
            val_dataset = TensorDataset(
                torch.tensor(X_val, dtype=torch.float32),
                torch.tensor(y_val, dtype=torch.int64)
            )
            model = ANNModel(input_dim=input_dim, num_classes=num_classes, hidden_dim1=128, hidden_dim2=64, dropout=dropout)

        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

        optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

        history = []
        for epoch in range(1, epochs + 1):
            model.train()
            total_train_loss = 0.0
            correct_train = 0
            total_train = 0

            for bx, by in train_loader:
                optimizer.zero_grad()
                out = model(bx)
                loss = criterion(out, by)
                loss.backward()
                optimizer.step()

                total_train_loss += loss.item() * bx.size(0)
                preds = torch.argmax(out, dim=1)
                correct_train += (preds == by).sum().item()
                total_train += bx.size(0)

            train_loss = total_train_loss / max(1, total_train)
            train_acc = correct_train / max(1, total_train)

            # Validation step
            model.eval()
            total_val_loss = 0.0
            correct_val = 0
            total_val = 0

            with torch.no_grad():
                for bx, by in val_loader:
                    out = model(bx)
                    loss = criterion(out, by)
                    total_val_loss += loss.item() * bx.size(0)
                    preds = torch.argmax(out, dim=1)
                    correct_val += (preds == by).sum().item()
                    total_val += bx.size(0)

            val_loss = total_val_loss / max(1, total_val)
            val_acc = correct_val / max(1, total_val)

            history.append({
                "epoch": epoch,
                "train_loss": round(train_loss, 4),
                "train_acc": round(train_acc, 4),
                "val_loss": round(val_loss, 4),
                "val_acc": round(val_acc, 4)
            })

        training_time = time.time() - start_time
        wrapper = PyTorchModelWrapper(model, model_type=model_type, seq_len=seq_len, num_classes=num_classes)
        return wrapper, training_time, history

    @staticmethod
    def save_model(wrapper: PyTorchModelWrapper, save_path: Path):
        save_path.parent.mkdir(parents=True, exist_ok=True)
        torch.save({
            "model_state_dict": wrapper.model.state_dict(),
            "model_type": wrapper.model_type,
            "seq_len": wrapper.seq_len,
            "num_classes": wrapper.num_classes,
            "architecture": type(wrapper.model).__name__
        }, save_path)

    @staticmethod
    def load_model(save_path: Path, input_dim: int) -> PyTorchModelWrapper:
        checkpoint = torch.load(save_path, map_location="cpu")
        model_type = checkpoint["model_type"]
        num_classes = checkpoint["num_classes"]
        seq_len = checkpoint.get("seq_len", 5)

        if "LSTM" in model_type:
            model = LSTMModel(input_dim=input_dim, num_classes=num_classes)
        else:
            model = ANNModel(input_dim=input_dim, num_classes=num_classes)

        model.load_state_dict(checkpoint["model_state_dict"])
        return PyTorchModelWrapper(model, model_type=model_type, seq_len=seq_len, num_classes=num_classes)

