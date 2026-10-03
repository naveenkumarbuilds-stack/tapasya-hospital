import React from 'react';
import { Star, ShieldCheck, Quote, ExternalLink } from 'lucide-react';
import type { ReviewItem } from '../types';

interface ReviewsSectionProps {
  reviews: ReviewItem[];
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews }) => {
  return (
    <section id="reviews" className="py-16 sm:py-24 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-slate-800">
          <div>
            <p className="text-xs font-bold tracking-widest text-teal-400 uppercase">
              Verifiable Patient Trust
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
              What Our Patients &amp; Families Say
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl">
              Authentic reviews from Google Maps and Justdial. Highlighting compassionate dialysis care, hygienic facilities, and immediate casualty attention.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div className="text-3xl font-extrabold text-amber-400 flex items-center gap-1">
              <span>5.0</span>
              <div className="flex gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
            <div className="text-xs border-l border-slate-700 pl-4">
              <div className="font-bold text-white">52+ Verified Reviews</div>
              <div className="text-slate-400">Google Maps &amp; Justdial</div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map(rev => (
            <div
              key={rev.id}
              className="bg-slate-800/60 rounded-2xl border border-slate-700/80 p-6 flex flex-col justify-between hover:border-slate-600 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  {rev.tag && (
                    <span className="text-[11px] font-medium text-teal-300">
                      {rev.tag}
                    </span>
                  )}
                </div>
                <Quote className="w-6 h-6 text-slate-600 mb-2" />
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{rev.text}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{rev.author}</div>
                  <div className="text-[11px] text-slate-400">{rev.date}</div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
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
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
          >
            <span>Read all reviews on Google Maps profile</span>
            <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
          </a>
        </div>
      </div>
    </section>
  );
};
