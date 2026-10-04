import React from 'react';
import { Siren, Stethoscope, MapPin, ShieldCheck, Star, HeartPulse, Clock, Award, Activity, Users } from 'lucide-react';

export const WhyChooseTapasya: React.FC = () => {
  const reasons = [
    {
      icon: Siren,
      title: '24/7 Emergency & Dialysis',
      desc: 'Round-the-clock casualty triage and hemodialysis services. Walk-in emergencies welcome anytime, any day.',
      color: 'emergency',
    },
    {
      icon: Stethoscope,
      title: 'Specialist Nephrology Care',
      desc: 'Advanced Hemodialysis Unit led by Dr. Pramod (MBBS, MD) with 12+ years of renal care expertise.',
      color: 'primary',
    },
    {
      icon: MapPin,
      title: 'Prime Location in Laggere',
      desc: 'Located next to Grace Public School on 50 Feet Main Road, Laggere — easily accessible from all parts of Bengaluru.',
      color: 'secondary',
    },
    {
      icon: ShieldCheck,
      title: 'Transparent Care & Modern Facilities',
      desc: 'Clean modular operation theatres, modern diagnostic labs, and ethical medical advice without unnecessary tests.',
      color: 'primary',
    },
    {
      icon: Star,
      title: '4.5★ Google Rating',
      desc: 'Trusted by 50+ verified patient reviews across Google and Justdial for compassionate, honest healthcare.',
      color: 'secondary',
    },
    {
      icon: HeartPulse,
      title: 'Multi-Speciality Under One Roof',
      desc: '15+ specialties including Cardiology, Orthopedics, Gastroenterology, Gynaecology, Urology, and more.',
      color: 'emergency',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-100', iconBg: 'bg-primary-500' },
    secondary: { bg: 'bg-secondary-50', text: 'text-secondary-600', border: 'border-secondary-100', iconBg: 'bg-secondary-500' },
    emergency: { bg: 'bg-emergency-50', text: 'text-emergency-600', border: 'border-emergency-100', iconBg: 'bg-emergency-500' },
  };

  return (
    <section id="why-choose" className="py-16 sm:py-24 bg-white border-b border-slate-100 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary-600 mb-2">
            Why Choose Tapasya Hospital
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Trusted Healthcare for Every Patient
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            From life-saving emergency care to advanced dialysis and multi-speciality consultations,
            Tapasya Hospital delivers dependable medical attention when you need it most.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Clock, value: '24/7', label: 'Emergency & Dialysis' },
            { icon: Star, value: '4.5★', label: 'Google Rating' },
            { icon: Users, value: '15+', label: 'Specialist Doctors' },
            { icon: Activity, value: '50+', label: 'Verified Reviews' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <stat.icon className="w-6 h-6 text-secondary-500 mx-auto mb-2" />
              <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Reasons Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reasons.map((reason, i) => {
            const colors = colorMap[reason.color];
            return (
              <div
                key={i}
                className={`p-6 rounded-2xl border ${colors.border} ${colors.bg} hover:shadow-md transition-all group`}
              >
                <div className={`w-12 h-12 rounded-xl ${colors.iconBg} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <reason.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{reason.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{reason.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Trust Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-5 h-5 text-amber-300" />
            <span className="font-bold text-lg">Committed to Ethical, Patient-Centered Healthcare</span>
          </div>
          <p className="text-sm text-primary-100 max-w-2xl mx-auto">
            Every patient receives honest medical advice, transparent pricing, and compassionate care
            from our team of experienced specialists and nursing staff.
          </p>
        </div>
      </div>
    </section>
  );
};
