"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import hero from "@/assets/images/hero-banner.jpg";

export function Hero() {
  return (
    <section className="relative h-[calc(100vh-112px)] overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${hero.src})`,
        }}
      />

      {/* Overlay sombre optionnel */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative flex h-full items-center px-6 sm:px-8">
        <div className="max-w-2xl">
          <h1 className="mb-4 text-4xl font-black leading-tight text-white md:text-5xl">
            Les meilleures parties airsoft
          </h1>
        </div>
      </div>
    </section>
  );
}
