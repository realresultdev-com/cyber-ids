import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DatasetManagement } from './pages/DatasetManagement';
import { DatasetDetails } from './pages/DatasetDetails';
import { Preprocessing } from './pages/Preprocessing';
import { ModelTraining } from './pages/ModelTraining';
import { ModelEvaluation } from './pages/ModelEvaluation';
import { ModelComparison } from './pages/ModelComparison';
import { IntrusionDetection } from './pages/IntrusionDetection';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { PacketInspector } from './pages/PacketInspector';
import { SecurityAlerts } from './pages/SecurityAlerts';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { TrafficAnalysis } from './pages/TrafficAnalysis';
import { ClassImbalanceAnalysis } from './pages/ClassImbalanceAnalysis';
import { DeepLearningAnalysis } from './pages/DeepLearningAnalysis';
import { ThreatIntelligence } from './pages/ThreatIntelligence';
import { AttackClassification } from './pages/AttackClassification';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* OPERATIONS */}
              <Route index element={<Dashboard />} />
              <Route path="monitoring" element={<LiveMonitoring />} />
              <Route path="inspector" element={<PacketInspector />} />
              <Route path="traffic-analysis" element={<TrafficAnalysis />} />
              <Route path="detection" element={<IntrusionDetection />} />
              <Route path="alerts" element={<SecurityAlerts />} />
              
              {/* THREAT RESEARCH */}
              <Route path="datasets" element={<DatasetManagement />} />
              <Route path="datasets/:id" element={<DatasetDetails />} />
              <Route path="preprocessing" element={<Preprocessing />} />
              <Route path="imbalance-analysis" element={<ClassImbalanceAnalysis />} />
              <Route path="training" element={<ModelTraining />} />
              <Route path="models/:id/evaluation" element={<ModelEvaluation />} />
              <Route path="comparison" element={<ModelComparison />} />
              <Route path="deep-learning" element={<DeepLearningAnalysis />} />

              {/* SECURITY INTELLIGENCE */}
              <Route path="attack-classification" element={<AttackClassification />} />
              <Route path="threat-intel" element={<ThreatIntelligence />} />
              <Route path="reports" element={<Reports />} />

              {/* SYSTEM */}
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
