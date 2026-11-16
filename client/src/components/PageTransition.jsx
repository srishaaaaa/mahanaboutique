import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollTop } from './SmoothScroll';

function Page({ children }) {
  useEffect(() => { scrollTop() }, []);
  return children;
}

// Pages switch instantly: no curtain sweep, no fade, no zoom. (The only loading screen is the homepage name splash.)
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  return <main key={pathname} id="main" tabIndex={-1} className="page"><Page>{children}</Page></main>;
}
