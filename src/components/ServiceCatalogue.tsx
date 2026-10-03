import React, { useState, useMemo } from 'react';
import { Search, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import type { ServiceItem } from '../types';

interface ServiceCatalogueProps {
  services: ServiceItem[];
  onSelectService: (serviceId: string) => void;
}

export const ServiceCatalogue: React.FC<ServiceCatalogueProps> = ({
  services,
  onSelectService
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = useMemo(() => {
    const list = Array.from(new Set(services.map(s => s.category)));
    return ['All', ...list];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchCat = selectedCategory === 'All' || service.category === selectedCategory;
      const matchSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.department.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch && service.isActive;
    });
  }, [services, selectedCategory, searchQuery]);

  return (
    <section id="services" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-widest text-teal-700 uppercase mb-2">
            Clinical Departments &amp; Verified Services
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Specialized Care &amp; Outpatient Services
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            All services are provided by experienced physicians and qualified medical staff at Tapasya Multi-Speciality Hospital in Laggere, Bengaluru. Review consultation durations and schedule your OPD appointment directly.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pb-6 border-b border-slate-200">
          {/* Segmented Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search treatment or doctor..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group hover:border-teal-300"
            >
              {/* Service Card Image */}
              {service.image && (
                <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={service.image}
                    alt={service.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/images/placeholder_facility.svg') {
                        target.src = '/images/placeholder_facility.svg';
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 text-xs text-white font-medium flex items-center justify-between">
                    <span className="bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded text-[11px]">
                      {service.department}
                    </span>
                    {service.isPopular && (
                      <span className="bg-teal-600/90 text-white px-2 py-0.5 rounded text-[11px] font-semibold">
                        Key Department
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Clean unboxed metadata separator */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 font-medium">
                    <span>{service.category}</span>
                    <span aria-hidden="true">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {service.durationMinutes} mins slot
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {service.name}
                  </h3>

                  <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {service.feeVerified && service.consultationFee ? (
                      <div>
                        <div className="text-[11px] text-slate-500 font-medium">OPD Consultation Fee</div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-extrabold text-slate-900">₹{service.consultationFee}</span>
                          <span className="text-[11px] text-teal-700 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            Verified
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 font-medium">
                        Consultation fee: <span className="text-amber-700 font-normal">Contact hospital (unverified)</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectService(service.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-sm shadow-teal-600/20 active:scale-95"
                  >
                    <span>Book Appointment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="mt-12 text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-sm font-semibold text-slate-800">No services match your search or filter.</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or searching for "Dialysis", "Surgery", or "Fever".</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
