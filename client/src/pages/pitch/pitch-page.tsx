import { Suspense } from "react";
import { useRoute, Redirect } from "wouter";
import { ALL_SLIDES } from "./pitch-config";
import PitchSlideWrapper from "./pitch-slide-wrapper";

export default function PitchPage() {
  const [, params] = useRoute("/pitch/:slideNum");
  const slideNum = parseInt(params?.slideNum || "1", 10);
  const slideIndex = slideNum - 1;

  if (isNaN(slideNum) || slideIndex < 0 || slideIndex >= ALL_SLIDES.length) {
    return <Redirect to="/pitch/1" />;
  }

  const SlideContent = ALL_SLIDES[slideIndex].component;

  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PitchSlideWrapper slideIndex={slideIndex}>
        <SlideContent />
      </PitchSlideWrapper>
    </Suspense>
  );
}
