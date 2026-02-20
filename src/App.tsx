import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectDataProvider } from '@/context/ProjectDataContext';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { ExecutiveSummary } from '@/pages/ExecutiveSummary';
import { ProjectPortfolio } from '@/pages/ProjectPortfolio';
import { GainFadeAnalysis } from '@/pages/GainFadeAnalysis';
import { CostAnalysis } from '@/pages/CostAnalysis';
import { MarketSegments } from '@/pages/MarketSegments';
import { TrendAnalysis } from '@/pages/TrendAnalysis';
import { ProjectDetail } from '@/pages/ProjectDetail';
import { ProjectComparison } from '@/pages/ProjectComparison';

export default function App() {
  return (
    <BrowserRouter>
      <ProjectDataProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<ExecutiveSummary />} />
            <Route path="/portfolio" element={<ProjectPortfolio />} />
            <Route path="/gain-fade" element={<GainFadeAnalysis />} />
            <Route path="/costs" element={<CostAnalysis />} />
            <Route path="/segments" element={<MarketSegments />} />
            <Route path="/trends" element={<TrendAnalysis />} />
            <Route path="/compare" element={<ProjectComparison />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProjectDataProvider>
    </BrowserRouter>
  );
}
