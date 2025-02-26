import { Plus_Jakarta_Sans } from "next/font/google";

export const plus = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

const typography: any = {
  fontFamily: plus.style.fontFamily,
  h1: {
    fontWeight: 700,
    fontSize: '1.75rem',
    lineHeight: '2.25rem',
  },
  h2: {
    fontWeight: 700,
    fontSize: '1.5rem',
    lineHeight: '2rem',
  },
  h3: {
    fontWeight: 700,
    fontSize: '1.25rem',
    lineHeight: '1.5rem',
  },
  h4: {
    fontWeight: 700,
    fontSize: '1.125rem',
    lineHeight: '1.4rem',
  },
  h5: {
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: '1.4rem',
  },
  h6: {
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: '1.1rem',
  },
  button: {
    textTransform: 'capitalize',
    fontWeight: 600,
  },
  body1: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    lineHeight: '1.25rem',
  },
  body2: {
    fontSize: '0.75rem',
    letterSpacing: '0rem',
    fontWeight: 500,
    lineHeight: '1rem',
  },
  subtitle1: {
    fontSize: '0.8125rem',
    fontWeight: 600,
  },
  subtitle2: {
    fontSize: '0.75rem',
    fontWeight: 600,
  },
};

export default typography;
