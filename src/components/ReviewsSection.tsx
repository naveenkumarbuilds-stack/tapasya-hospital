import React from 'react';
import { Star, ShieldCheck, Quote, ExternalLink } from 'lucide-react';
import type { ReviewItem } from '../types';

interface ReviewsSectionProps {
  reviews: ReviewItem[];
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews }) => {
  return (
    <section id="reviews" className="py-16 sm:py-24 bg-primary-700 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-primary-600">
          <div>
            <p className="text-xs font-bold tracking-widest text-secondary-300 uppercase">
              Verifiable Patient Trust
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
              What Our Patients &amp; Families Say
            </h2>
            <p className="text-xs sm:text-sm text-primary-200 mt-2 max-w-xl">
              Authentic reviews from Google Maps and Justdial. Highlighting compassionate dialysis care,
              hygienic facilities, and immediate casualty attention.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-primary-800/80 p-4 rounded-2xl border border-primary-600">
            <div className="text-3xl font-extrabold text-amber-400 flex items-center gap-1.5">
              <span>4.5</span>
              <div className="flex gap-0.5 text-amber-400">
                {[...Array(4)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
                <Star className="w-4 h-4 fill-amber-400/50 text-amber-400/50" />
              </div>
            </div>
            <div className="text-xs border-l border-primary-600 pl-4">
              <div className="font-bold text-white">50+ Verified Reviews</div>
              <div className="text-primary-300">Google Maps &amp; Justdial</div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map(rev => (
            <div
              key={rev.id}
              className="bg-primary-800/60 rounded-2xl border border-primary-600/80 p-6 flex flex-col justify-between hover:border-secondary-400 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  {rev.tag && (
                    <span className="text-[11px] font-medium text-secondary-300">
                      {rev.tag}
                    </span>
                  )}
                </div>
                <Quote className="w-6 h-6 text-primary-600 mb-2" />
                <p className="text-xs sm:text-sm text-primary-100 leading-relaxed italic">
                  "{rev.text}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-primary-600/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{rev.author}</div>
                  <div className="text-[11px] text-primary-300">{rev.date}</div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-primary-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-secondary-400" />
                  <span>{rev.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Google Maps External Link */}
        <div className="mt-12 text-center">
          <a
            href="https://maps.app.goo.gl/EcYFQsPjZDsa5Ymj9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold text-primary-700 bg-white hover:bg-primary-50 rounded-xl border border-primary-200 transition-colors min-h-[44px]"
          >
            <span>Read all reviews on Google Maps profile</span>
            <ExternalLink className="w-3.5 h-3.5 text-secondary-500" />
          </a>
        </div>
      </div>
    </section>
  );
};
