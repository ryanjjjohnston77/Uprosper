import { lazy } from "react";

export interface PitchSlideConfig {
  component: React.LazyExoticComponent<React.ComponentType>;
  slug: string;
}

export const PITCH_SLIDES: PitchSlideConfig[] = [
  { component: lazy(() => import("./slide-0-title")), slug: "title" },
  { component: lazy(() => import("./slide-1-problem")), slug: "problem" },
  { component: lazy(() => import("./slide-2-solution")), slug: "solution" },
  { component: lazy(() => import("./slide-3-market")), slug: "market" },
  { component: lazy(() => import("./slide-3-competition")), slug: "competition" },
  { component: lazy(() => import("./slide-3-product-client")), slug: "product" },
  { component: lazy(() => import("./slide-5-business-model")), slug: "business-model" },
  { component: lazy(() => import("./slide-6-compliance")), slug: "compliance" },
  { component: lazy(() => import("./slide-9-roadmap")), slug: "roadmap" },
  { component: lazy(() => import("./slide-7-team")), slug: "team" },
  { component: lazy(() => import("./slide-8-ask")), slug: "ask" },
];

export const APPENDIX_SLIDES: PitchSlideConfig[] = [
  { component: lazy(() => import("./slide-10-sources")), slug: "sources" },
];

export const ALL_SLIDES = [...PITCH_SLIDES, ...APPENDIX_SLIDES];
export const MAIN_SLIDE_COUNT = PITCH_SLIDES.length;
