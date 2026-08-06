const audienceCard = document.querySelector(".audience__card");
const showcaseSection = document.querySelector(".showcase");
const showcaseRevealItems = document.querySelectorAll(".showcase__feature, .showcase__card");
const benefitsSection = document.querySelector(".benefits");
const benefitsRevealItems = document.querySelectorAll(".benefits__item");
const testimonialsSection = document.querySelector(".testimonials");
const testimonialCards = document.querySelectorAll(".testimonial-card");
const offerCtaSection = document.querySelector(".offer-cta");
const offerCard = document.querySelector(".offer-card");
const faqSection = document.querySelector(".faq-section");
const faqItems = document.querySelectorAll(".faq-item");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const initLineReveal = (root = document) => {
  const targets = root.querySelectorAll("[data-split='heading']");

  targets.forEach((target) => {
    if (target.dataset.revealReady === "true") {
      return;
    }

    const originalText = target.textContent.trim();

    if (!originalText) {
      return;
    }

    target.dataset.revealReady = "true";
    target.setAttribute("aria-label", originalText);
    target.textContent = "";

    const line = document.createElement("span");
    line.setAttribute("data-reveal-line", "");
    line.setAttribute("aria-hidden", "true");
    target.appendChild(line);

    originalText.split(/\s+/).forEach((word, index, words) => {
      const inner = document.createElement("span");
      inner.setAttribute("data-reveal-inner", "");
      inner.textContent = word;

      if (index < words.length - 1) {
        inner.style.marginRight = "0.18em";
      }

      line.appendChild(inner);
    });

    const inners = target.querySelectorAll("[data-reveal-inner]");

    if (reduceMotion.matches || !window.gsap) {
      inners.forEach((inner) => {
        inner.style.transform = "translateY(0)";
      });
      return;
    }

    window.gsap.set(inners, { y: "110%" });
    window.gsap.to(inners, {
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.025,
      scrollTrigger: window.ScrollTrigger
        ? {
            trigger: target,
            start: "top 86%",
            once: true,
          }
        : undefined,
    });
  });
};

const initFlickCardsStack = (root = document) => {
  const sections = root.querySelectorAll("[data-effect='flick-cards-stack'][data-flick-cards-init]");

  if (!window.gsap) {
    return;
  }

  if (window.ScrollTrigger && window.Draggable) {
    window.gsap.registerPlugin(window.ScrollTrigger, window.Draggable);
  }

  sections.forEach((section) => {
    if (section.dataset.flickCardsReady === "true") {
      return;
    }

    const slider = section.querySelector("[data-flick-cards-list]");
    const cards = Array.from(section.querySelectorAll("[data-flick-cards-item]"));
    const total = cards.length;

    if (!slider || total < 7) {
      console.log("Not minimum of 7 cards");
      return;
    }

    section.dataset.flickCardsReady = "true";

    let activeIndex = 0;
    let sliderWidth = slider.offsetWidth || window.innerWidth;
    const threshold = 0.1;

    const getConfig = (i, currentIndex) => {
      let diff = i - currentIndex;

      if (diff > total / 2) {
        diff -= total;
      }

      if (diff < -total / 2) {
        diff += total;
      }

      if (diff === 0) {
        return { x: 0, y: 0, rot: 0, s: 1, o: 1, z: 5 };
      }

      if (diff === 1) {
        return { x: 25, y: 1, rot: 10, s: 0.9, o: 1, z: 4 };
      }

      if (diff === -1) {
        return { x: -25, y: 1, rot: -10, s: 0.9, o: 1, z: 4 };
      }

      if (diff === 2) {
        return { x: 45, y: 5, rot: 15, s: 0.8, o: 1, z: 3 };
      }

      if (diff === -2) {
        return { x: -45, y: 5, rot: -15, s: 0.8, o: 1, z: 3 };
      }

      const dir = diff > 0 ? 1 : -1;
      return { x: 55 * dir, y: 5, rot: 20 * dir, s: 0.6, o: 0, z: 2 };
    };

    const getStatus = (cfg) => {
      if (cfg.x === 0) {
        return "active";
      }

      if (cfg.x === 25) {
        return "2-after";
      }

      if (cfg.x === -25) {
        return "2-before";
      }

      if (cfg.x === 45) {
        return "3-after";
      }

      if (cfg.x === -45) {
        return "3-before";
      }

      return "hidden";
    };

    const applyCardConfig = (card, cfg, animate = true) => {
      card.dataset.flickCardsItemStatus = getStatus(cfg);
      card.style.zIndex = cfg.z;

      const vars = {
        xPercent: cfg.x,
        yPercent: cfg.y,
        rotation: cfg.rot,
        scale: cfg.s,
        opacity: cfg.o,
      };

      if (!animate || reduceMotion.matches) {
        window.gsap.set(card, vars);
        return;
      }

      window.gsap.to(card, {
        ...vars,
        duration: 0.6,
        ease: "elastic.out(1.2, 1)",
      });
    };

    const render = (currentIndex, animate = true) => {
      cards.forEach((card, index) => {
        applyCardConfig(card, getConfig(index, currentIndex), animate);
      });
    };

    const interpolateCards = (nextIndex, progress) => {
      cards.forEach((card, index) => {
        const from = getConfig(index, activeIndex);
        const to = getConfig(index, nextIndex);
        const cfg = {
          x: from.x + (to.x - from.x) * progress,
          y: from.y + (to.y - from.y) * progress,
          rot: from.rot + (to.rot - from.rot) * progress,
          s: from.s + (to.s - from.s) * progress,
          o: from.o + (to.o - from.o) * progress,
          z: progress > 0.5 ? to.z : from.z,
        };

        card.style.zIndex = cfg.z;
        window.gsap.set(card, {
          xPercent: cfg.x,
          yPercent: cfg.y,
          rotation: cfg.rot,
          scale: cfg.s,
          opacity: cfg.o,
        });
      });
    };

    const updateSliderWidth = () => {
      sliderWidth = slider.offsetWidth || window.innerWidth;
    };

    const draggers = cards.map((card) => {
      const existingDragger = card.querySelector("[data-flick-cards-dragger]");

      if (existingDragger) {
        return existingDragger;
      }

      const dragger = document.createElement("div");
      dragger.setAttribute("data-flick-cards-dragger", "");
      card.appendChild(dragger);
      return dragger;
    });

    section.setAttribute("data-flick-drag-status", "grab");
    render(activeIndex, false);

    if (reduceMotion.matches || !window.Draggable) {
      return;
    }

    window.Draggable.create(draggers, {
      type: "x",
      edgeResistance: 0.8,
      inertia: false,
      onPress() {
        updateSliderWidth();
        this.applyBounds({ minX: -sliderWidth / 2, maxX: sliderWidth / 2 });
        this.startPointerX = this.pointerX;
        this.startPointerY = this.pointerY;
        section.setAttribute("data-flick-drag-status", "grabbing");
      },
      onDrag() {
        const rawProgress = this.x / sliderWidth;
        const progress = Math.min(1, Math.abs(rawProgress));
        const direction = rawProgress > 0 ? -1 : 1;
        const nextIndex = (activeIndex + direction + total) % total;

        interpolateCards(nextIndex, progress);
      },
      onRelease() {
        const raw = this.x / sliderWidth;
        const dragDistance = Math.hypot(this.pointerX - this.startPointerX, this.pointerY - this.startPointerY);
        let shifted = false;

        section.setAttribute("data-flick-drag-status", "grab");

        if (raw > threshold) {
          activeIndex = (activeIndex - 1 + total) % total;
          shifted = true;
        } else if (raw < -threshold) {
          activeIndex = (activeIndex + 1) % total;
          shifted = true;
        }

        render(activeIndex, shifted);

        window.gsap.to(this.target, {
          x: 0,
          duration: 0.3,
          ease: "power1.out",
        });

        if (dragDistance < 4) {
          const target = this.target;

          target.style.pointerEvents = "none";
          const clickTarget = document.elementFromPoint(this.pointerX, this.pointerY);
          target.style.pointerEvents = "";

          if (clickTarget) {
            clickTarget.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
          }
        }
      },
    });

    window.addEventListener("resize", () => {
      updateSliderWidth();
      render(activeIndex, false);
    });
  });
};

const initMethodStepsStack = (root = document) => {
  const sections = root.querySelectorAll("[data-effect='method-steps-stack']");

  if (!window.gsap || !window.ScrollTrigger) {
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);

  sections.forEach((section) => {
    if (section.dataset.methodStepsReady === "true") {
      return;
    }

    const cardsWrap = section.querySelector(".team-cards");
    const teamInfo = section.querySelector(".team-info");
    const cards = Array.from(section.querySelectorAll(".team-card"));
    const descriptions = Array.from(section.querySelectorAll(".team-description"));
    const counter = section.querySelector(".team-counter-value");

    if (!cardsWrap || !teamInfo || !cards.length || !descriptions.length || !counter) {
      return;
    }

    section.dataset.methodStepsReady = "true";

    if (reduceMotion.matches || !window.ScrollTrigger) {
      window.gsap.set(cards, { clearProps: "transform,opacity" });
      return;
    }

    let timeline;
    let currentActive = 0;
    let lastScrollY = window.scrollY;
    let smoothedVelocity = 0;
    let velocityFrame;
    let resizeTimer;

    const setActive = (index) => {
      if (index === currentActive) {
        return;
      }

      currentActive = index;

      cards.forEach((card, cardIndex) => {
        card.classList.toggle("is-active", cardIndex === index);
      });

      descriptions.forEach((description, descriptionIndex) => {
        description.classList.toggle("is-active", descriptionIndex === index);
      });

      window.gsap.to(counter, {
        yPercent: -8,
        opacity: 0,
        duration: 0.12,
        overwrite: true,
        onComplete() {
          counter.textContent = String(index + 1).padStart(2, "0");

          window.gsap.fromTo(
            counter,
            { yPercent: 8, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.18, overwrite: true }
          );
        },
      });
    };

    const setupPinnedStack = () => {
      if (timeline) {
        timeline.scrollTrigger && timeline.scrollTrigger.kill();
        timeline.kill();
      }

      const gap = parseFloat(getComputedStyle(cardsWrap).getPropertyValue("--stack-gap")) || 0;
      const stepX = cardsWrap.offsetWidth + gap;
      const stepY = cardsWrap.offsetHeight + gap;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const isTablet = window.matchMedia("(max-width: 1199px)").matches && !isMobile;
      const enterX = isMobile ? stepX * 0.82 : stepX;
      const enterY = isMobile ? stepY * 0.72 : stepY;
      const distance = isMobile
        ? Math.max(window.innerHeight * cards.length * 0.9, 3400)
        : isTablet
          ? Math.max(window.innerHeight * cards.length, 4200)
          : Math.max(window.innerHeight * cards.length * 1.05, 5200);

      window.gsap.set([cardsWrap, counter.parentElement, teamInfo], { y: 28, opacity: 0 });

      cards.forEach((card, index) => {
        window.gsap.set(card, {
          x: index === 0 ? 0 : enterX,
          y: index === 0 ? 0 : enterY,
          opacity: index === 0 ? 1 : 0.3,
          zIndex: cards.length - index,
        });
      });

      currentActive = -1;
      counter.textContent = "01";
      setActive(0);

      timeline = window.gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${distance}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate(self) {
            section.style.setProperty("--progress", self.progress.toFixed(4));
            const active = window.gsap.utils.clamp(
              0,
              cards.length - 1,
              Math.round(self.progress * (cards.length - 1))
            );

            setActive(active);
          },
        },
      });

      const introDuration = 0.55;

      timeline.to([cardsWrap, counter.parentElement, teamInfo], {
        y: 0,
        opacity: 1,
        duration: introDuration,
      });

      for (let index = 0; index < cards.length - 1; index += 1) {
        const position = introDuration + index;

        timeline.to(cards[index], { x: -stepX, y: -enterY, opacity: 0.3, duration: 1 }, position);
        timeline.to(cards[index + 1], { x: 0, y: 0, opacity: 1, duration: 1 }, position);
      }

      timeline.to({}, { duration: 0.45 });
      timeline.to([cardsWrap, counter.parentElement, teamInfo], {
        y: -24,
        opacity: 0,
        duration: 0.45,
      });
    };

    const updateVelocity = () => {
      const nextScrollY = window.scrollY;
      const velocity = nextScrollY - lastScrollY;

      smoothedVelocity += (velocity - smoothedVelocity) * 0.12;
      section.style.setProperty("--scroll-velocity", smoothedVelocity.toFixed(3));
      lastScrollY = nextScrollY;
      velocityFrame = window.requestAnimationFrame(updateVelocity);
    };

    setupPinnedStack();
    velocityFrame = window.requestAnimationFrame(updateVelocity);

    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setupPinnedStack, 150);
    });

  });
};

const initBlurLinesReveal = (root = document) => {
  const sections = root.querySelectorAll("[data-effect='blur-lines-reveal']");

  if (!sections.length || !window.gsap || !window.ScrollTrigger) {
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);

  sections.forEach((section) => {
    if (section.dataset.blurLinesReady === "true") {
      return;
    }

    const lines = Array.from(section.querySelectorAll(".persuasion-reveal__line"));

    if (!lines.length) {
      return;
    }

    section.dataset.blurLinesReady = "true";

    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    window.gsap.set(lines, {
      opacity: 0.16,
      filter: isMobile ? "blur(10px)" : "blur(14px)",
      y: reduceMotion.matches ? 0 : "0.28em",
    });

    window.gsap.to(lines, {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      ease: "none",
      stagger: isMobile ? 0.12 : 0.18,
      scrollTrigger: {
        trigger: section,
        start: isMobile ? "top 92%" : "top 82%",
        end: isMobile ? "top 18%" : "55% top",
        scrub: isMobile ? 0.65 : 0.9,
        invalidateOnRefresh: true,
      },
    });
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  const sceneHost = document.getElementById("hero02-scene");

  initLineReveal();
  initMethodStepsStack();
  initBlurLinesReveal();

  if (window.ScrollTrigger) {
    window.ScrollTrigger.refresh();
  }

  if (!sceneHost || !window.Hero02Studio || !window.hero02SceneData) {
    return;
  }

  const sceneDataTag = document.createElement("script");
  sceneDataTag.id = "hero02-scene-data";
  sceneDataTag.type = "application/json";
  sceneDataTag.textContent = JSON.stringify(window.hero02SceneData);
  document.body.appendChild(sceneDataTag);

  try {
    await window.Hero02Studio.addScene({
      elementId: "hero02-scene",
      filePath: "hero02-scene-data",
      scale: 1,
      dpi: 1.5,
      fps: 60,
      lazyLoad: false,
    });
  } catch (error) {
    console.error("hero02 scene error", error);
  }
});

if (audienceCard) {
  if (reduceMotion.matches) {
    audienceCard.classList.add("is-visible");
  } else {
    const revealAudienceCard = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          audienceCard.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -12% 0px",
      }
    );

    revealAudienceCard.observe(audienceCard);
  }
}

if (showcaseRevealItems.length > 0) {
  if (reduceMotion.matches) {
    showcaseRevealItems.forEach((item) => {
      item.classList.add("is-visible");
    });
  } else {
    showcaseRevealItems.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${index * 130}ms`);
    });

    const revealShowcaseCards = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          showcaseRevealItems.forEach((item) => {
            item.classList.add("is-visible");
          });

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -64px 0px",
      }
    );

    revealShowcaseCards.observe(showcaseSection);
  }
}

if (benefitsRevealItems.length > 0) {
  if (reduceMotion.matches) {
    benefitsRevealItems.forEach((item) => {
      item.classList.add("is-visible");
    });
  } else {
    benefitsRevealItems.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${index * 120}ms`);
    });

    const revealBenefitsItems = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          benefitsRevealItems.forEach((item) => {
            item.classList.add("is-visible");
          });

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -56px 0px",
      }
    );

    if (benefitsSection) {
      revealBenefitsItems.observe(benefitsSection);
    }
  }
}

if (testimonialCards.length > 0) {
  if (reduceMotion.matches) {
    testimonialCards.forEach((item) => {
      item.classList.add("is-visible");
    });
  } else {
    testimonialCards.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${index * 140}ms`);
    });

    const revealTestimonials = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          testimonialCards.forEach((item) => {
            item.classList.add("is-visible");
          });

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -56px 0px",
      }
    );

    if (testimonialsSection) {
      revealTestimonials.observe(testimonialsSection);
    }
  }
}

if (offerCard) {
  if (reduceMotion.matches) {
    offerCard.classList.add("is-visible");
  } else {
    const revealOfferCard = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          offerCard.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -56px 0px",
      }
    );

    if (offerCtaSection) {
      revealOfferCard.observe(offerCtaSection);
    }
  }
}

if (faqItems.length > 0) {
  faqItems.forEach((item) => {
    const button = item.querySelector(".faq-item__button");

    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      faqItems.forEach((currentItem) => {
        const currentButton = currentItem.querySelector(".faq-item__button");
        currentItem.classList.remove("is-open");

        if (currentButton) {
          currentButton.setAttribute("aria-expanded", "false");
        }
      });

      if (!isOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  if (reduceMotion.matches) {
    faqItems.forEach((item) => {
      item.classList.add("is-visible");
    });
  } else {
    faqItems.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${index * 70}ms`);
    });

    const revealFaqItems = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          faqItems.forEach((item) => {
            item.classList.add("is-visible");
          });

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -56px 0px",
      }
    );

    if (faqSection) {
      revealFaqItems.observe(faqSection);
    }
  }
}

const checkoutButton = document.querySelector(".offer-card__button");

if (checkoutButton) {
  checkoutButton.addEventListener("click", () => {
    if (!window.riseMeta) {
      return;
    }

    window.riseMeta.track("InitiateCheckout", {
      content_name: "Rise Social",
      content_category: "Página Dark",
    });
  });
}
