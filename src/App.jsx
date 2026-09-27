import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import VendorDashboard from './pages/vendor/VendorDashboard';
import AppleSideNav from './components/AppleSideNav';
import GemLogo from './components/GemLogo';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  const [activeIndex, setActiveIndex] = useState(0);
  const homeContainerRef = useRef(null);

  const handleSlideInView = useCallback((index) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (!isHomePage) return;
    const container = homeContainerRef.current;
    if (!container) return;
    const sections = container.querySelectorAll('section[data-slide-index]');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-slide-index'));
            if (!isNaN(index)) setActiveIndex(index);
          }
        });
      },
      { root: container, threshold: 0.55 }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, [isHomePage]);

  const handleSelectSection = (index) => {
    setActiveIndex(index);
    const container = homeContainerRef.current;
    if (container) {
      container.scrollTo({
        top: index * (container.clientHeight || window.innerHeight),
        behavior: 'smooth',
      });
    }
  };

  // Pages where we hide the home UI chrome
  const isAuthOrDashboard =
    location.pathname === '/login' ||
    location.pathname.startsWith('/vendor') ||
    location.pathname.startsWith('/officer');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030612]">

      {/* GeM logo — home only */}
      {isHomePage && (
        <div className="fixed top-6 left-8 z-50">
          <Link
            to="/"
            className="inline-flex items-center transition-transform hover:scale-105 active:scale-95 focus:outline-none"
            title="GeM - Government e-Marketplace"
          >
            <GemLogo height={80} />
          </Link>
        </div>
      )}

      {/* Login button — home only */}
      {isHomePage && (
        <div className="fixed top-6 right-8 z-50">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-full text-xs font-mono-code font-bold tracking-wider uppercase text-white bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 backdrop-blur-xl transition-all duration-200 cursor-pointer shadow-lg active:scale-95 flex items-center gap-2"
          >
            <span>Login</span>
            <svg className="w-3.5 h-3.5 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      )}

      {/* Side nav — home only */}
      {isHomePage && (
        <AppleSideNav
          activeIndex={activeIndex}
          onSelectSection={handleSelectSection}
        />
      )}

      {/* Routes */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* Home */}
          <Route
            path="/"
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="w-full h-full"
              >
                <HomePage
                  containerRef={homeContainerRef}
                  onNavigateToLogin={() => navigate('/login')}
                  onSlideInView={handleSlideInView}
                />
              </motion.div>
            }
          />

          {/* Login */}
          <Route
            path="/login"
            element={
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="w-full h-full"
              >
                <LoginPage />
              </motion.div>
            }
          />

          {/* Vendor Dashboard */}
          <Route
            path="/vendor/dashboard"
            element={
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                <VendorDashboard />
              </motion.div>
            }
          />

          {/* Officer Dashboard — placeholder for next */}
          <Route
            path="/officer/dashboard"
            element={
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                <div className="w-full h-full flex items-center justify-center bg-[#050A18]">
                  <p className="text-white font-mono">Officer Dashboard — Coming Soon</p>
                </div>
              </motion.div>
            }
          />

        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}