import { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectDataProvider } from '@/context/ProjectDataContext';
import { useProjectData } from '@/hooks/useProjectData';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/pages/LandingPage';

// Each analysis page is its own chunk, fetched the first time its route renders. Recharts
// is most of the weight and only these pages draw charts, so a visitor who reads the
// landing page and leaves never downloads it. The landing page stays in the entry chunk:
// it is the first screen for most visits, and lazy-loading it would add a round trip
// before anything shows. AppShell holds the Suspense boundary, so the header, sidebar and
// filters stay on screen while a page chunk loads.
const ExecutiveSummary = lazy(() => import('@/pages/ExecutiveSummary').then((m) => ({ default: m.ExecutiveSummary })));
const ProjectPortfolio = lazy(() => import('@/pages/ProjectPortfolio').then((m) => ({ default: m.ProjectPortfolio })));
const GainFadeAnalysis = lazy(() => import('@/pages/GainFadeAnalysis').then((m) => ({ default: m.GainFadeAnalysis })));
const CostAnalysis = lazy(() => import('@/pages/CostAnalysis').then((m) => ({ default: m.CostAnalysis })));
const MarketSegments = lazy(() => import('@/pages/MarketSegments').then((m) => ({ default: m.MarketSegments })));
const MarketExposure = lazy(() => import('@/pages/MarketExposure').then((m) => ({ default: m.MarketExposure })));
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail').then((m) => ({ default: m.ProjectDetail })));

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
            <Route path="/market" element={<MarketExposure />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProjectDataProvider>
    </BrowserRouter>
  );
}
