'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MarketLocation, LOCATIONS } from '@/lib/types';

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

interface FormData {
  full_name: string;
  phone: string;
  email: string;
  city: string;
  position: string;
  location: MarketLocation;
  experience: string;
  cover_letter: string;
  availability: string;
}

interface FormErrors {
  full_name?: string;
  phone?: string;
  email?: string;
  position?: string;
  profile_image?: string;
  cv_file?: string;
}

const INITIAL_FORM: FormData = {
  full_name: '',
  phone: '',
  email: '',
  city: '',
  position: '',
  location: 'LEAR MARKET 1',
  experience: '',
  cover_letter: '',
  availability: '',
};

export default function ApplicationForm() {
  const searchParams = useSearchParams();
  const preselectedPosition = searchParams.get('position') ?? '';
  const preselectedLocation = (searchParams.get('location') as MarketLocation) ?? 'LEAR MARKET 1';

  const [formData, setFormData] = useState<FormData>({
    ...INITIAL_FORM,
    location: preselectedLocation,
    position: preselectedPosition,
  });
  const [positions, setPositions] = useState<string[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  // Load reCAPTCHA script (only when site key is configured)
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    if (document.querySelector('script[data-recaptcha]')) return;
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.dataset.recaptcha = '1';
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const supabaseClient = createClient();
    setPositionsLoading(true);
    supabaseClient
      .from('job_positions')
      .select('title')
      .eq('location', formData.location)
      .order('title')
      .then(({ data }) => {
        if (data) setPositions(data.map((p: { title: string }) => p.title));
        setPositionsLoading(false);
      });
  }, [formData.location]);

  // If positions loaded and preselected position exists in list, keep it; otherwise clear
  useEffect(() => {
    if (positions.length > 0 && preselectedPosition && !positions.includes(preselectedPosition)) {
      setFormData((prev) => ({ ...prev, position: '' }));
    }
  }, [positions, preselectedPosition]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleProfileImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        profile_image: 'Only JPG, JPEG, or PNG files are allowed.',
      }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        profile_image: 'Image must be smaller than 2MB.',
      }));
      return;
    }

    setProfileImage(file);
    setErrors((prev) => ({ ...prev, profile_image: undefined }));

    const reader = new FileReader();
    reader.onload = (ev) => setProfilePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrors((prev) => ({
        ...prev,
        cv_file: 'Only PDF files are allowed.',
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        cv_file: 'CV must be smaller than 5MB.',
      }));
      return;
    }

    setCvFile(file);
    setErrors((prev) => ({ ...prev, cv_file: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    let valid = true;

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Emri i plotë është i detyrueshëm.';
      valid = false;
    }

    const phoneRegex = /^\+?[0-9\s\-()]{8,}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Numri i telefonit është i detyrueshëm.';
      valid = false;
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone =
        'Vendosni një numër telefoni të vlefshëm (min 8 shifra).';
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Adresa e emailit është e detyrueshme.';
      valid = false;
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Vendosni një adresë emaili të vlefshme.';
      valid = false;
    }

    if (!formData.position) {
      newErrors.position = 'Ju lutem zgjidhni një pozicion.';
      valid = false;
    }

    if (!profileImage) {
      newErrors.profile_image = 'Foto e profilit është e detyrueshme.';
      valid = false;
    }

    if (!cvFile) {
      newErrors.cv_file = 'CV / Rezymeja është e detyrueshme.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const getRecaptchaToken = (): Promise<string> =>
    new Promise((resolve) => {
      if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined' || !window.grecaptcha) {
        resolve('');
        return;
      }
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(RECAPTCHA_SITE_KEY, { action: 'submit_application' })
          .then(resolve)
          .catch(() => resolve(''));
      });
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();
      const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // Upload profile image
      const profileExt = profileImage!.name.split('.').pop()?.toLowerCase();
      const profilePath = `${uid}-photo.${profileExt}`;

      const { error: profileErr } = await supabase.storage
        .from('profile-images')
        .upload(profilePath, profileImage!);
      if (profileErr) throw new Error('Ngarkimi i fotos dështoi. Ju lutem provoni përsëri.');

      const { data: profileUrlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(profilePath);

      // Upload CV
      const cvPath = `${uid}-cv.pdf`;
      const { error: cvErr } = await supabase.storage
        .from('cv-files')
        .upload(cvPath, cvFile!);
      if (cvErr) throw new Error('Ngarkimi i CV-së dështoi. Ju lutem provoni përsëri.');

      const { data: cvUrlData } = supabase.storage
        .from('cv-files')
        .getPublicUrl(cvPath);

      // Get reCAPTCHA token (optional — gracefully skipped if not configured)
      const recaptchaToken = await getRecaptchaToken();

      // Save application via server API (rate limiting + reCAPTCHA verification)
      const submitRes = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim().toLowerCase(),
          city: formData.city.trim() || null,
          position: formData.position,
          location: formData.location,
          experience: formData.experience.trim() || null,
          cover_letter: formData.cover_letter.trim() || null,
          availability: formData.availability || null,
          profile_image_url: profileUrlData.publicUrl,
          cv_file_url: cvUrlData.publicUrl,
          recaptchaToken,
        }),
      });

      const submitResult = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(submitResult.error ?? 'Ruajtja e aplikimit dështoi. Ju lutem provoni përsëri.');
      }

      // Notify admin via email (fire-and-forget)
      fetch('/api/notify-new-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          position: formData.position,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
        }),
      }).catch(() => {}); // never block the user

      // Reset form
      setIsSuccess(true);
      setFormData(INITIAL_FORM);
      setProfileImage(null);
      setCvFile(null);
      setProfilePreview(null);
      if (profileInputRef.current) profileInputRef.current.value = '';
      if (cvInputRef.current) cvInputRef.current.value = '';
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Ndodhi një gabim i papritur.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Aplikimi u Dërgua!
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg leading-relaxed">
          Faleminderit që aplikuat në LEAR MARKET. Do të shqyrtojmë aplikimin
          tuaj dhe do t'ju kontaktojmë së shpejti.
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="bg-[#0f2d5c] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1a3d7a] transition-colors"
        >
          Dërgo Aplikim Tjetër
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10">
      {/* ── Personal Information ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Informacioni Personal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Emri i Plotë <span className="text-red-500">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="p.sh. Agim Berisha"
              className={`w-full px-4 py-3 rounded-lg border text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.full_name
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
            {errors.full_name && (
              <p className="mt-1.5 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Numri i Telefonit <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+355 69 123 4567"
              className={`w-full px-4 py-3 rounded-lg border text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.phone && (
              <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Adresa Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ju@shembull.com"
              className={`w-full px-4 py-3 rounded-lg border text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Qyteti
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              placeholder="p.sh. Tiranë"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>
      </section>

      {/* ── Location Picker ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Zgjidhni Markun
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LOCATIONS.map((loc) => (
            <button
              type="button"
              key={loc.value}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  location: loc.value,
                  position: '',
                }))
              }
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.location === loc.value
                  ? 'border-[#0f2d5c] bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <p className="font-bold text-gray-900 text-sm">{loc.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {loc.label.split('— ')[1]}
              </p>
              {formData.location === loc.value && (
                <p className="text-xs text-[#0f2d5c] font-medium mt-1">✓ E zgjedhur</p>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── Job Details ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Detajet e Punës
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Position */}
          <div>
            <label
              htmlFor="position"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Pozicioni <span className="text-red-500">*</span>
            </label>
            <select
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border text-sm bg-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.position
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300'
              }`}
            >
              <option value="">
                {positionsLoading ? 'Duke ngarkuar pozitat…' : 'Zgjidhni një pozicion…'}
              </option>
              {positions.map((pos, i) => (
                <option key={i} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
            {errors.position && (
              <p className="mt-1.5 text-sm text-red-600">{errors.position}</p>
            )}
          </div>

          {/* Availability */}
          <div>
            <label
              htmlFor="availability"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Disponueshmëria
            </label>
            <select
              id="availability"
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">Zgjidhni disponueshmërinë…</option>
              <option value="full-time">Kohë e plotë</option>
              <option value="part-time">Kohë e pjesshme</option>
              <option value="flexible">Fleksibël</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Documents ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Dokumentet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Photo */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-1.5">
              Foto Profili <span className="text-red-500">*</span>
            </p>
            <div
              onClick={() => profileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition hover:bg-gray-50 ${
                errors.profile_image
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300'
              }`}
            >
              {profilePreview ? (
                <div className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profilePreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover ring-2 ring-blue-400 mb-2"
                  />
                  <p className="text-sm text-gray-600 truncate max-w-full">
                    {profileImage?.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Klikoni për të ndryshuar</p>
                </div>
              ) : (
                <div className="py-3">
                  <svg
                    className="mx-auto h-10 w-10 text-gray-400 mb-2"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-sm text-gray-600 font-medium">
                    Klikoni për të ngarkuar foton
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    JPG, JPEG, PNG — max 2MB
                  </p>
                </div>
              )}
              <input
                ref={profileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleProfileImage}
                className="hidden"
              />
            </div>
            {errors.profile_image && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.profile_image}
              </p>
            )}
          </div>

          {/* CV Upload */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-1.5">
              CV / Rezymeja <span className="text-red-500">*</span>
            </p>
            <div
              onClick={() => cvInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition hover:bg-gray-50 ${
                errors.cv_file ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            >
              {cvFile ? (
                <div className="flex flex-col items-center py-3">
                  <svg
                    className="h-10 w-10 text-red-500 mb-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-gray-700 font-medium truncate max-w-full">
                    {cvFile.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Klikoni për të ndryshuar</p>
                </div>
              ) : (
                <div className="py-3">
                  <svg
                    className="mx-auto h-10 w-10 text-gray-400 mb-2"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-sm text-gray-600 font-medium">
                    Klikoni për të ngarkuar CV
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Vetëm PDF — max 5MB
                  </p>
                </div>
              )}
              <input
                ref={cvInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleCvFile}
                className="hidden"
              />
            </div>
            {errors.cv_file && (
              <p className="mt-1.5 text-sm text-red-600">{errors.cv_file}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Additional Information ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Informacione Shtesë
        </h2>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="experience"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Eksperienca e Punës
            </label>
            <textarea
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              rows={4}
              placeholder="Përshkruani eksperiencën tuaj të punës, rolet e mëparshme dhe aftësitë…"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="cover_letter"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Letër Motivuese
            </label>
            <textarea
              id="cover_letter"
              name="cover_letter"
              value={formData.cover_letter}
              onChange={handleChange}
              rows={5}
              placeholder="Na tregoni pse dëshironi të bashkoheni me LEAR MARKET dhe çfarë ju bën kandidatin ideal…"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            />
          </div>
        </div>
      </section>

      {/* Submit Error */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2.5 bg-[#0f2d5c] text-white px-10 py-4 rounded-xl text-base font-semibold hover:bg-[#1a3d7a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Duke Dërguar…
            </>
          ) : (
            'Dërgo Aplikimin'
          )}
        </button>
      </div>
    </form>
  );
}
