import LandingpageText from "components/landingpage/text";
import SectionLayout from "layout/section";
import React from "react";
import { Button } from "rebass";

export default function GlobalizationHeroSection() {
  return (
    <SectionLayout debug>
      <LandingpageText variant="h1" textAlign="center">
        Globalize your design.
      </LandingpageText>
      <LandingpageText variant="body1" textAlign="center">
        Localization management tools for leading teams. Automation, workflow,
        and even feedback. Product use designers, developers, and translators.
      </LandingpageText>
      <Button>Join the wait list</Button>
    </SectionLayout>
  );
}
