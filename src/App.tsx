import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectDataProvider } from '@/context/ProjectDataContext';
import { useProjectData } from '@/hooks/useProjectData';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { ExecutiveSummary } from '@/pages/ExecutiveSummary';
import { ProjectPortfolio } from '@/pages/ProjectPortfolio';
import { GainFadeAnalysis } from '@/pages/GainFadeAnalysis';
import { CostAnalysis } from '@/pages/CostAnalysis';
import { MarketSegments } from '@/pages/MarketSegments';
import { ProjectDetail } from '@/pages/ProjectDetail';

// In embed mode the sample data is already loaded at boot, so the marketing
// landing page is skipped in favor of the thesis-aligned Gain / Fade view.
function LandingOrEmbed() {
  const { state } = useProjectData();
  if (state.embed) return <Navigate to="/gain-fade?embed=1" replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ProjectDataProvider>
        <Routes>
          <Route path="/" element={<LandingOrEmbed />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<ExecutiveSummary />} />
            <Route path="/portfolio" element={<ProjectPortfolio />} />
            <Route path="/gain-fade" element={<GainFadeAnalysis />} />
            <Route path="/costs" element={<CostAnalysis />} />
            <Route path="/segments" element={<MarketSegments />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProjectDataProvider>
    </BrowserRouter>
  );
}
