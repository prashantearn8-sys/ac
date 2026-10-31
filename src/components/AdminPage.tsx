import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowLeft,
  Check,
  IndianRupee,
  Lock,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  ADMIN_EMAIL,
  deleteServiceInFirestore,
  isAdminEmail,
  saveServiceInFirestore,
} from '../firebase';
import { ServiceCardIllustration } from './AcGraphics';

export interface DisplayServiceItem {
  id: string;
  name: string;
  tagline: string;
  priceInr: number;
  iconIndex: number;
  isDefault: boolean;
  existsInFirestore: boolean;
}

interface AdminPageProps {
  user: User | null;
  services: DisplayServiceItem[];
  onSignIn: () => Promise<void>;
  onBackToHome: () => void;
}

const GRAPHIC_LABELS = [
  'Hydro-Jet Spray',
  'Coil Shield Wash',
  'Gas & Manifold Gauge',
  '365-Day AMC Shield',
  'PCB & Circuit Diagnostic',
  'Split AC Installation',
];

export function AdminPage({
  user,
  services,
  onSignIn,
  onBackToHome,
}: AdminPageProps) {
  const isAdmin = isAdminEmail(user?.email);

  // Local editable drafts keyed by service ID
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Add New Service Form State
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newIconIndex, setNewIconIndex] = useState<number>(0);
  const [addingService, setAddingService] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const getDraftPrice = (item: DisplayServiceItem) =>
    priceDrafts[item.id] !== undefined ? priceDrafts[item.id] : String(item.priceInr);

  const getDraftName = (item: DisplayServiceItem) =>
    nameDrafts[item.id] !== undefined ? nameDrafts[item.id] : item.name;

  const handleUpdateService = async (item: DisplayServiceItem) => {
    setFeedback(null);
    setSavingId(item.id);
    try {
      const updatedName = getDraftName(item).trim();
      const updatedPrice = Number(getDraftPrice(item));
      if (!updatedName || updatedName.length < 2) {
        throw new Error('Service name must be at least 2 characters.');
      }
      if (isNaN(updatedPrice) || updatedPrice < 49) {
        throw new Error('Please enter a valid price (minimum ₹49).');
      }

      await saveServiceInFirestore({
        id: item.id,
        name: updatedName,
        tagline: item.tagline || 'Professional AC servicing & inspection',
        priceInr: updatedPrice,
        iconIndex: item.iconIndex,
        existsInFirestore: item.existsInFirestore,
      });

      setSavedId(item.id);
      setTimeout(() => {
        setSavedId((prev) => (prev === item.id ? null : prev));
      }, 2200);
      setFeedback({
        type: 'success',
        text: `Updated "${updatedName}" price to ₹${Math.round(updatedPrice).toLocaleString('en-IN')}.`,
      });
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Failed to update service.';
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error) msg = parsed.error;
      } catch {
        // Keep raw error
      }
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSavingId(null);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setAddingService(true);

    try {
      const cleanName = newName.trim();
      const numericPrice = Number(newPrice);

      if (cleanName.length < 2) {
        throw new Error('Please enter a service name (at least 2 characters).');
      }
      if (isNaN(numericPrice) || numericPrice < 49) {
        throw new Error('Please enter a valid price in INR (minimum ₹49).');
      }

      await saveServiceInFirestore({
        name: cleanName,
        tagline: 'Factory-grade AC service by Cool Bros AC Service',
        priceInr: numericPrice,
        iconIndex: newIconIndex,
        existsInFirestore: false,
      });

      setNewName('');
      setNewPrice('');
      setFeedback({
        type: 'success',
        text: `Added new service "${cleanName}" (₹${Math.round(numericPrice).toLocaleString('en-IN')}).`,
      });
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Could not add service.';
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error) msg = parsed.error;
      } catch {
        // Keep raw error
      }
      setFeedback({ type: 'error', text: msg });
    } finally {
      setAddingService(false);
    }
  };

  const handleDeleteOrReset = async (item: DisplayServiceItem) => {
    if (!item.existsInFirestore) return;
    setFeedback(null);
    setSavingId(item.id);
    try {
      await deleteServiceInFirestore(item.id);
      setPriceDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setNameDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setFeedback({
        type: 'success',
        text: item.isDefault
          ? `Reset "${item.name}" back to default pricing.`
          : `Removed service "${item.name}".`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not remove service.',
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="py-10 sm:py-14 lg:py-20 bg-[#F8FAFC] min-h-[75vh]">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 space-y-8">
        {/* Top Bar: Back Button + Admin Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#191A23]/15">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#0284C7] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Website</span>
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-[#191A23]">
                Admin Dashboard
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#7DD3FC] text-[#191A23] border border-[#191A23]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{ADMIN_EMAIL}</span>
              </span>
            </div>
          </div>

          {user && (
            <div className="bg-white border border-[#191A23] rounded-2xl px-4 py-2.5 text-xs font-mono text-[#191A23]">
              Signed in as: <strong className="font-bold">{user.email}</strong>
            </div>
          )}
        </div>

        {/* Access Gate if not signed in as coolbrosacservice@gmail.com */}
        {!isAdmin ? (
          <div className="bg-white border-2 border-[#191A23] rounded-3xl p-6 sm:p-10 max-w-xl mx-auto text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-[#7DD3FC] border border-[#191A23] flex items-center justify-center mx-auto text-[#191A23]">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[#191A23]">
                Admin Access Restricted
              </h2>
              <p className="text-sm text-[#191A23]/75 leading-relaxed">
                Only the official administrator account{' '}
                <strong className="text-[#191A23] font-mono">{ADMIN_EMAIL}</strong> can change
                service pricing or add new AC services.
              </p>
              {user?.email && (
                <p className="text-xs font-mono text-[#B91C1C] bg-[#FEE2E2] border border-[#B91C1C]/30 rounded-xl py-2 px-3">
                  Currently signed in as {user.email} (Standard Account)
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onSignIn}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] text-sm font-bold text-white bg-[#191A23] rounded-xl hover:bg-[#191A23]/90 transition-colors cursor-pointer"
              >
                <span>Sign in with {ADMIN_EMAIL}</span>
              </button>
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3.5 min-h-[48px] text-sm font-semibold text-[#191A23] bg-[#F3F3F3] border border-[#191A23] rounded-xl hover:bg-[#7DD3FC] transition-colors cursor-pointer"
              >
                Return Home
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT 5 COLS: Add New Service Card */}
            <div className="lg:col-span-5 bg-white border-2 border-[#191A23] rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-[#0284C7]">
                  CREATE NEW PACKAGE
                </span>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-[#191A23]">
                  Add New Service
                </h2>
                <p className="text-xs sm:text-sm text-[#191A23]/70">
                  Add a new AC service with image, name, and price. It will appear immediately on the
                  website.
                </p>
              </div>

              <form onSubmit={handleAddService} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#191A23] mb-1.5">
                    SERVICE NAME *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Split AC Foam Wash"
                    className="w-full px-4 py-3 text-sm bg-[#F8FAFC] border border-[#191A23] rounded-xl focus:outline-2 focus:outline-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#191A23] mb-1.5">
                    PRICE (₹ INR) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-[#191A23]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min={49}
                      max={500000}
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="599"
                      className="w-full pl-9 pr-4 py-3 text-sm font-mono font-bold bg-[#F8FAFC] border border-[#191A23] rounded-xl focus:outline-2 focus:outline-[#0284C7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#191A23] mb-2">
                    SELECT SERVICE IMAGE *
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {GRAPHIC_LABELS.map((label, idx) => {
                      const selected = newIconIndex === idx;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setNewIconIndex(idx)}
                          className={`p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#E0F2FE] border-2 border-[#0284C7]'
                              : 'bg-[#F8FAFC] border-[#191A23]/20 hover:border-[#191A23]'
                          }`}
                        >
                          <div className="w-14 h-14 flex items-center justify-center overflow-hidden">
                            <div className="scale-50 origin-center">
                              <ServiceCardIllustration index={idx} />
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-semibold text-[#191A23] text-center leading-tight line-clamp-1">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={addingService}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] text-sm font-bold text-[#191A23] bg-[#7DD3FC] border border-[#191A23] rounded-xl hover:bg-[#38BDF8] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{addingService ? 'Adding Service...' : 'Add Service to Website'}</span>
                </button>
              </form>
            </div>

            {/* RIGHT 7 COLS: Manage Existing Services & Change Pricing */}
            <div className="lg:col-span-7 bg-white border-2 border-[#191A23] rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-[#0284C7]">
                    LIVE PRICING CONTROL
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-[#191A23]">
                    Change Service Pricing ({services.length})
                  </h2>
                </div>
              </div>

              {feedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium ${
                    feedback.type === 'success'
                      ? 'bg-[#DCFCE7] border-[#166534] text-[#14532D]'
                      : 'bg-[#FEE2E2] border-[#991B1B] text-[#7F1D1D]'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <div className="space-y-4">
                {services.map((item) => {
                  const isSaving = savingId === item.id;
                  const isSaved = savedId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#191A23]/20 hover:border-[#191A23] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Service Image + Editable Name */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-[#191A23]/15 flex items-center justify-center shrink-0 overflow-hidden">
                          <div className="scale-[0.55] origin-center">
                            <ServiceCardIllustration index={item.iconIndex} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <input
                            type="text"
                            value={getDraftName(item)}
                            onChange={(e) =>
                              setNameDrafts((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            aria-label="Service Name"
                            className="w-full px-3 py-1.5 text-sm sm:text-base font-display font-bold text-[#191A23] bg-white border border-[#191A23]/25 rounded-lg focus:outline-2 focus:outline-[#0284C7]"
                          />
                          <div className="flex items-center gap-2 text-[11px] font-mono text-[#191A23]/60">
                            <span>ID: {item.id}</span>
                            {!item.isDefault && (
                              <span className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold">
                                Custom Service
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price Input + Save / Delete Buttons */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                        <div className="relative w-28 sm:w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#191A23]/60">
                            ₹
                          </span>
                          <input
                            type="number"
                            min={49}
                            max={500000}
                            value={getDraftPrice(item)}
                            onChange={(e) =>
                              setPriceDrafts((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            aria-label={`Price for ${item.name}`}
                            className="w-full pl-7 pr-2.5 py-2.5 text-sm sm:text-base font-mono font-bold text-[#191A23] bg-white border border-[#191A23] rounded-xl focus:outline-2 focus:outline-[#0284C7] tabular-nums"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleUpdateService(item)}
                          className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] text-xs font-bold rounded-xl border border-[#191A23] transition-all cursor-pointer ${
                            isSaved
                              ? 'bg-[#86EFAC] text-[#191A23]'
                              : 'bg-[#191A23] text-white hover:bg-[#0284C7]'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>{isSaving ? 'Saving...' : 'Save'}</span>
                            </>
                          )}
                        </button>

                        {item.existsInFirestore && (
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleDeleteOrReset(item)}
                            title={
                              item.isDefault
                                ? 'Reset to default price'
                                : 'Delete custom service'
                            }
                            className="p-2.5 min-h-[42px] rounded-xl bg-white border border-[#191A23]/30 text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                          >
                            {item.isDefault ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
