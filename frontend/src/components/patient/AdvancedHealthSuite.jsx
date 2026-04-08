import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaBalanceScale,
  FaCalendarCheck,
  FaUsers,
  FaHospital,
  FaShieldAlt,
  FaBrain,
  FaPills,
  FaCheckCircle,
  FaClock,
  FaPlus,
  FaSave,
  FaTrash,
  FaEdit,
  FaBell,
  FaSyncAlt,
} from 'react-icons/fa';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { patientAPI } from '../../services/api';

const TREATMENTS = [
  'General Checkup',
  'Cardiology Consultation',
  'Orthopedic Evaluation',
  'Diabetes Management',
  'Mental Wellness Session',
];

const INSURANCE_PLANS = ['Basic', 'Standard', 'Premium', 'None'];

const moodTips = {
  stressed: 'Try a 4-7-8 breathing cycle for 2 minutes and postpone non-urgent decisions.',
  anxious: 'Ground yourself with a 5-4-3-2-1 sensory check before returning to work.',
  sad: 'Send one check-in message to a trusted person and take a short walk.',
  calm: 'Great state for planning. Use this time for your top-priority tasks.',
};

const scoreClass = (score) => {
  if (score >= 85) return 'text-emerald-700 bg-emerald-100';
  if (score >= 70) return 'text-amber-700 bg-amber-100';
  return 'text-rose-700 bg-rose-100';
};

const Card = ({ title, subtitle, icon: Icon, accent, children }) => (
  <section className="bg-white/95 backdrop-blur rounded-2xl border border-white/60 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.35)] p-5 animate-[fadeInUp_350ms_ease-out]">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-slate-900 font-bold text-base">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="text-white" />
      </span>
    </div>
    {children}
  </section>
);

const AdvancedHealthSuite = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [suiteState, setSuiteState] = useState({
    familyMembers: [],
    moodLogs: [],
    medications: [],
    costEstimations: [],
    adherenceLogs: [],
    waitTimeLogs: [],
    insuranceVarianceLogs: [],
    journal: '',
    mood: 'calm',
  });

  const [charts, setCharts] = useState({
    adherenceWeekly: [],
    waitTimeTrend: [],
    insuranceVariance: [],
  });

  const [slots, setSlots] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [suiteEvents, setSuiteEvents] = useState([]);
  const [toast, setToast] = useState(null);
  const [eventFilter, setEventFilter] = useState('ALL');
  const [eventLimit, setEventLimit] = useState(8);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  const [treatment, setTreatment] = useState('General Checkup');
  const [severity, setSeverity] = useState(1.2);
  const [days, setDays] = useState(3);
  const [insurancePlan, setInsurancePlan] = useState('Standard');
  const [estimateResult, setEstimateResult] = useState(null);

  const [memberDraft, setMemberDraft] = useState({ name: '', relation: 'Child', condition: 'General Wellness' });
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [memberEditDraft, setMemberEditDraft] = useState({ condition: '', risk: 'Low' });

  const hydratedRef = useRef(false);
  const refreshInFlightRef = useRef(false);
  const [medicationDraft, setMedicationDraft] = useState({ name: '', time: '09:00 PM' });
  const [editingMedicationId, setEditingMedicationId] = useState(null);
  const [medicationEditDraft, setMedicationEditDraft] = useState({ time: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2200);
  };

  const medications = useMemo(() => {
    if (suiteState.medications?.length) return suiteState.medications;
    return [
      { id: 1, name: 'Metformin 500mg', time: '08:00 AM', taken: true },
      { id: 2, name: 'Vitamin D3', time: '01:00 PM', taken: true },
      { id: 3, name: 'Atorvastatin 10mg', time: '09:00 PM', taken: false },
    ];
  }, [suiteState.medications]);

  const bestSlot = useMemo(() => {
    if (!slots.length) return null;
    return slots.reduce((a, b) => (a.score > b.score ? a : b));
  }, [slots]);

  const adherence = useMemo(() => {
    if (!medications.length) return 0;
    const done = medications.filter((m) => m.taken).length;
    return Math.round((done / medications.length) * 100);
  }, [medications]);

  const eventTypes = useMemo(() => {
    const types = Array.from(new Set((suiteEvents || []).map((evt) => evt.type).filter(Boolean)));
    return ['ALL', ...types];
  }, [suiteEvents]);

  const visibleEvents = useMemo(() => {
    const filtered = (suiteEvents || []).filter((evt) => eventFilter === 'ALL' || evt.type === eventFilter);
    return filtered.slice(0, eventLimit);
  }, [suiteEvents, eventFilter, eventLimit]);

  const refreshLiveData = async () => {
    if (refreshInFlightRef.current) return;

    refreshInFlightRef.current = true;
    try {
      const [chartRes, slotRes, hospitalRes, eventsRes] = await Promise.all([
        patientAPI.getSuiteCharts(),
        patientAPI.getOptimizedSlots(),
        patientAPI.getHospitalInsights(),
        patientAPI.getSuiteEvents(),
      ]);

      setCharts(chartRes.data?.data || { adherenceWeekly: [], waitTimeTrend: [], insuranceVariance: [] });
      setSlots(slotRes.data?.data || []);
      setHospitals(hospitalRes.data?.data || []);
      setSuiteEvents(eventsRes.data?.data || []);
      setLastRefreshAt(new Date());
    } catch (error) {
      console.error('Failed to refresh live suite data', error);
    } finally {
      refreshInFlightRef.current = false;
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [stateRes, chartRes, slotRes, hospitalRes] = await Promise.all([
          patientAPI.getSuiteState(),
          patientAPI.getSuiteCharts(),
          patientAPI.getOptimizedSlots(),
          patientAPI.getHospitalInsights(),
        ]);

        const stateData = stateRes.data?.data || {};
        setSuiteState((prev) => ({ ...prev, ...stateData }));
        setCharts(chartRes.data?.data || { adherenceWeekly: [], waitTimeTrend: [], insuranceVariance: [] });
        setSlots(slotRes.data?.data || []);
        setHospitals(hospitalRes.data?.data || []);
        const eventsRes = await patientAPI.getSuiteEvents();
        setSuiteEvents(eventsRes.data?.data || []);
        setLastRefreshAt(new Date());

        const latestEst = stateData.costEstimations?.[0];
        if (latestEst) {
          setEstimateResult(latestEst);
          setTreatment(latestEst.treatment || 'General Checkup');
          setSeverity(Number(latestEst.severity) || 1.2);
          setDays(Number(latestEst.days) || 3);
          setInsurancePlan(latestEst.insurancePlan || 'Standard');
        }
      } catch (error) {
        console.error('Failed to load suite data', error);
      } finally {
        hydratedRef.current = true;
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!autoRefreshEnabled) return undefined;

    const interval = setInterval(() => {
      refreshLiveData();
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  useEffect(() => {
    if (!hydratedRef.current) return;

    const timer = setTimeout(async () => {
      try {
        setSaving(true);
        await patientAPI.updateSuiteJournal({ journal: suiteState.journal || '' });
      } catch (error) {
        console.error('Journal save failed', error);
      } finally {
        setSaving(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [suiteState.journal]);

  const refreshCharts = async () => {
    try {
      const chartRes = await patientAPI.getSuiteCharts();
      setCharts(chartRes.data?.data || { adherenceWeekly: [], waitTimeTrend: [], insuranceVariance: [] });
    } catch (error) {
      console.error('Failed to refresh charts', error);
    }
  };

  const refreshEvents = async () => {
    try {
      const eventsRes = await patientAPI.getSuiteEvents();
      setSuiteEvents(eventsRes.data?.data || []);
    } catch (error) {
      console.error('Failed to refresh events', error);
    }
  };

  const handleEstimate = async () => {
    try {
      const payload = { treatment, severity, days, insurancePlan };
      const res = await patientAPI.estimateSuiteCost(payload);
      setEstimateResult(res.data?.data || null);
      await refreshCharts();
      await refreshEvents();
      showToast('Cost estimation updated');
    } catch (error) {
      console.error('Failed to estimate cost', error);
      showToast('Could not estimate cost', 'error');
    }
  };

  const addMember = async () => {
    if (!memberDraft.name.trim()) return;
    try {
      setSaving(true);
      const res = await patientAPI.addFamilyMember(memberDraft);
      setSuiteState((prev) => ({ ...prev, ...(res.data?.data || {}) }));
      setMemberDraft({ name: '', relation: 'Child', condition: 'General Wellness' });
      await refreshEvents();
      showToast('Family member added');
    } catch (error) {
      console.error('Failed to add family member', error);
      showToast('Failed to add family member', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (id) => {
    try {
      setSaving(true);
      const res = await patientAPI.removeFamilyMember(id);
      setSuiteState((prev) => ({ ...prev, ...(res.data?.data || {}) }));
      await refreshEvents();
      showToast('Family member removed');
    } catch (error) {
      console.error('Failed to remove family member', error);
      showToast('Failed to remove family member', 'error');
    } finally {
      setSaving(false);
    }
  };

  const editMember = async (member) => {
    setEditingMemberId(member.id);
    setMemberEditDraft({
      condition: member.condition || '',
      risk: member.risk || 'Low',
    });
  };

  const saveMemberEdit = async (memberId) => {
    try {
      const res = await patientAPI.updateFamilyMember(memberId, {
        condition: memberEditDraft.condition,
        risk: memberEditDraft.risk,
      });
      setSuiteState((prev) => ({ ...prev, ...(res.data?.data || {}) }));
      await refreshEvents();
      showToast('Family member updated');
      setEditingMemberId(null);
    } catch (error) {
      console.error('Failed to update family member', error);
      showToast('Failed to update family member', 'error');
    }
  };

  const addMedication = async () => {
    if (!medicationDraft.name.trim()) return;
    try {
      setSaving(true);
      const res = await patientAPI.addMedication({
        name: medicationDraft.name.trim(),
        time: medicationDraft.time,
      });
      setSuiteState((prev) => ({ ...prev, ...(res.data?.data || {}) }));
      setMedicationDraft({ name: '', time: '09:00 PM' });
      await refreshEvents();
      showToast('Medication added');
    } catch (error) {
      console.error('Failed to add medication', error);
      showToast('Failed to add medication', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeMedication = async (id) => {
    try {
      setSaving(true);
      const res = await patientAPI.removeMedication(id);
      setSuiteState((prev) => ({ ...prev, ...(res.data?.data || {}) }));
      await refreshEvents();
      showToast('Medication removed');
    } catch (error) {
      console.error('Failed to remove medication', error);
      showToast('Failed to remove medication', 'error');
    } finally {
      setSaving(false);
    }
  };

  const editMedication = async (med) => {
    setEditingMedicationId(med.id);
    setMedicationEditDraft({ time: med.time || '' });
  };

  const saveMedicationEdit = async (medId) => {
    try {
      const res = await patientAPI.updateMedication(medId, { time: medicationEditDraft.time });
      setSuiteState((prev) => ({ ...prev, ...(res.data?.data || {}) }));
      await refreshEvents();
      showToast('Medication updated');
      setEditingMedicationId(null);
    } catch (error) {
      console.error('Failed to update medication', error);
      showToast('Failed to update medication', 'error');
    }
  };

  const toggleMed = async (id) => {
    try {
      const res = await patientAPI.toggleMedication(id);
      const nextState = res.data?.data || {};
      setSuiteState((prev) => ({ ...prev, ...nextState }));

      const nextMeds = nextState.medications || medications;
      const done = nextMeds.filter((m) => m.taken).length;
      const nextAdherence = nextMeds.length ? Math.round((done / nextMeds.length) * 100) : 0;
      await patientAPI.updateSuiteAdherence({ date: new Date().toISOString().slice(0, 10), adherence: nextAdherence });
      await refreshCharts();
      await refreshEvents();
      showToast('Adherence updated');
    } catch (error) {
      console.error('Failed to update adherence', error);
      showToast('Could not update adherence', 'error');
    }
  };

  const updateMood = async (nextMood) => {
    try {
      setSaving(true);
      const res = await patientAPI.logSuiteMood({ mood: nextMood, note: suiteState.journal || '' });
      setSuiteState((prev) => ({ ...prev, ...(res.data?.data || {}) }));
      await refreshEvents();
      showToast('Mood updated');
    } catch (error) {
      console.error('Failed to update mood', error);
      showToast('Failed to update mood', 'error');
    } finally {
      setSaving(false);
    }
  };

  const outOfPocket = estimateResult?.outOfPocket ?? 0;
  const coveredAmount = estimateResult?.coveredAmount ?? 0;
  const estimatedCost = estimateResult?.estimatedCost ?? 0;
  const claimChance = estimateResult?.claimApprovalChance ?? 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full rounded-3xl p-5 md:p-6 bg-[radial-gradient(circle_at_15%_20%,#c7f9e4_0%,#eff6ff_36%,#eef2ff_68%,#f8fafc_100%)]">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.message}
        </div>
      )}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Smart Health Suite</h2>
          <p className="text-sm text-slate-600">Connected backend APIs with persistent state and trend analytics.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => setAutoRefreshEnabled((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${autoRefreshEnabled ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <FaSyncAlt className={autoRefreshEnabled ? 'animate-spin [animation-duration:3s]' : ''} />
            {autoRefreshEnabled ? 'Auto refresh ON' : 'Auto refresh OFF'}
          </button>
          <span className="text-[11px] text-slate-500">
            {lastRefreshAt ? `Last sync: ${lastRefreshAt.toLocaleTimeString()}` : 'Last sync: not yet'}
          </span>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${saving ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            <FaSave /> {saving ? 'Saving...' : 'Synced'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="Treatment Cost Estimator" subtitle="Predict treatment cost with severity and duration" icon={FaBalanceScale} accent="bg-gradient-to-br from-sky-500 to-blue-600">
          <div className="space-y-3">
            <select value={treatment} onChange={(e) => setTreatment(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200">
              {TREATMENTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1"><span>Condition Severity</span><span>{severity.toFixed(1)}x</span></div>
              <input type="range" min="1" max="2.4" step="0.1" value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="w-full" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600">Treatment Days</label>
              <input type="number" min="1" max="30" value={days} onChange={(e) => setDays(Number(e.target.value) || 1)} className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
            </div>
            <button onClick={handleEstimate} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-semibold">Calculate with AI Cost API</button>
            <div className="rounded-xl bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-300">Estimated Total</span>
              <span className="font-bold text-xl">Rs. {estimatedCost.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card title="Wait Time + Appointment Optimization" subtitle="Smartly ranked consultation slots from backend" icon={FaCalendarCheck} accent="bg-gradient-to-br from-emerald-500 to-teal-600">
          <div className="space-y-2">
            {bestSlot && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                Best slot now: <strong>{bestSlot.slot}</strong> with {bestSlot.doctor} ({bestSlot.waitMin} min wait)
              </div>
            )}
            {slots.map((slot, idx) => (
              <div key={`${slot.slot}-${idx}`} className="grid grid-cols-4 gap-2 text-xs sm:text-sm border border-slate-100 rounded-xl px-3 py-2.5 items-center">
                <span className="font-semibold text-slate-700">{slot.slot}</span>
                <span className="text-slate-500">{slot.doctor}</span>
                <span className="text-slate-500"><FaClock className="inline mr-1" />{slot.waitMin} min</span>
                <span className={`justify-self-end px-2 py-1 rounded-full text-xs font-semibold ${scoreClass(slot.score)}`}>Score {slot.score}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Family Health Manager" subtitle="Track family profiles in one persistent record" icon={FaUsers} accent="bg-gradient-to-br from-violet-500 to-fuchsia-600">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
            <input className="sm:col-span-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Name" value={memberDraft.name} onChange={(e) => setMemberDraft((p) => ({ ...p, name: e.target.value }))} />
            <select className="sm:col-span-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" value={memberDraft.relation} onChange={(e) => setMemberDraft((p) => ({ ...p, relation: e.target.value }))}>
              <option>Child</option><option>Spouse</option><option>Parent</option><option>Sibling</option>
            </select>
            <input className="sm:col-span-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Condition" value={memberDraft.condition} onChange={(e) => setMemberDraft((p) => ({ ...p, condition: e.target.value }))} />
            <button onClick={addMember} className="sm:col-span-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-3 py-2 flex items-center justify-center gap-1"><FaPlus /> Add</button>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {(suiteState.familyMembers || []).map((person) => (
              <div key={person.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 bg-white">
                <div>
                  <p className="font-semibold text-sm text-slate-800">{person.name} <span className="text-slate-400 font-normal">({person.relation})</span></p>
                  {editingMemberId === person.id ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        className="rounded border border-slate-200 px-2 py-1 text-xs"
                        value={memberEditDraft.condition}
                        onChange={(e) => setMemberEditDraft((prev) => ({ ...prev, condition: e.target.value }))}
                      />
                      <select
                        className="rounded border border-slate-200 px-2 py-1 text-xs"
                        value={memberEditDraft.risk}
                        onChange={(e) => setMemberEditDraft((prev) => ({ ...prev, risk: e.target.value }))}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">{person.condition}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingMemberId === person.id ? (
                    <>
                      <button onClick={() => saveMemberEdit(person.id)} className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold">Save</button>
                      <button onClick={() => setEditingMemberId(null)} className="text-slate-500 hover:text-slate-700 text-xs">Cancel</button>
                    </>
                  ) : (
                    <>
                      <span className={`text-xs font-semibold rounded-full px-2 py-1 ${person.risk === 'High' ? 'bg-rose-100 text-rose-700' : person.risk === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{person.risk || 'Low'}</span>
                      <button onClick={() => editMember(person)} className="text-blue-500 hover:text-blue-700 text-xs">
                        <FaEdit />
                      </button>
                      <button onClick={() => removeMember(person.id)} className="text-rose-500 hover:text-rose-700 text-xs">
                        <FaTrash />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Hospital Intelligence Layer" subtitle="Backend-ranked hospitals by readiness and specialist depth" icon={FaHospital} accent="bg-gradient-to-br from-cyan-500 to-sky-600">
          <div className="space-y-2">
            {hospitals.map((h) => (
              <div key={h.name} className="border border-slate-100 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{h.name}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${scoreClass(h.smartScore)}`}>SmartScore {h.smartScore}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{h.distance} away • Occupancy {h.occupancy}% • Emergency {h.emergency}%</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Insurance + Cost Prediction" subtitle="Estimate out-of-pocket and claim confidence" icon={FaShieldAlt} accent="bg-gradient-to-br from-indigo-500 to-violet-600">
          <div className="space-y-3">
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={insurancePlan} onChange={(e) => setInsurancePlan(e.target.value)}>
              {INSURANCE_PLANS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-100 p-2.5"><p className="text-[11px] text-slate-500">Covered</p><p className="font-bold text-slate-700">Rs. {coveredAmount.toLocaleString()}</p></div>
              <div className="rounded-xl bg-rose-50 p-2.5"><p className="text-[11px] text-rose-500">Out-of-pocket</p><p className="font-bold text-rose-700">Rs. {outOfPocket.toLocaleString()}</p></div>
              <div className="rounded-xl bg-emerald-50 p-2.5"><p className="text-[11px] text-emerald-500">Claim Chance</p><p className="font-bold text-emerald-700">{claimChance}%</p></div>
            </div>
          </div>
        </Card>

        <Card title="AI Mental Health Companion" subtitle="Mood check-in and coping guidance, persisted over time" icon={FaBrain} accent="bg-gradient-to-br from-pink-500 to-rose-600">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {['calm', 'stressed', 'anxious', 'sad'].map((m) => (
                <button key={m} onClick={() => updateMood(m)} className={`px-3 py-1.5 text-xs rounded-full font-semibold ${suiteState.mood === m ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {m}
                </button>
              ))}
            </div>
            <textarea rows={3} value={suiteState.journal || ''} onChange={(e) => setSuiteState((prev) => ({ ...prev, journal: e.target.value }))} placeholder="How are you feeling today?" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
              <strong>Companion tip:</strong> {moodTips[suiteState.mood || 'calm']}
            </div>
          </div>
        </Card>

        <Card title="Drug Reminder + Smart Adherence Tracking" subtitle="Mark doses and monitor adherence trends" icon={FaPills} accent="bg-gradient-to-br from-amber-500 to-orange-600">
          <div className="rounded-xl bg-slate-900 text-white px-3 py-2.5 mb-3 flex items-center justify-between">
            <span className="text-sm">Today adherence</span>
            <span className="text-lg font-bold">{adherence}%</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            <input
              className="sm:col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Medication name"
              value={medicationDraft.name}
              onChange={(e) => setMedicationDraft((prev) => ({ ...prev, name: e.target.value }))}
            />
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="09:00 PM"
                value={medicationDraft.time}
                onChange={(e) => setMedicationDraft((prev) => ({ ...prev, time: e.target.value }))}
              />
              <button onClick={addMedication} className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 text-sm">
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {medications.map((m) => (
              <div key={m.id} className="flex items-center justify-between border border-slate-100 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                  {editingMedicationId === m.id ? (
                    <input
                      className="mt-1 rounded border border-slate-200 px-2 py-1 text-xs"
                      value={medicationEditDraft.time}
                      onChange={(e) => setMedicationEditDraft({ time: e.target.value })}
                    />
                  ) : (
                    <p className="text-xs text-slate-500">Reminder at {m.time}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingMedicationId === m.id ? (
                    <>
                      <button onClick={() => saveMedicationEdit(m.id)} className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold">Save</button>
                      <button onClick={() => setEditingMedicationId(null)} className="text-slate-500 hover:text-slate-700 text-xs">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => toggleMed(m.id)} className={`px-3 py-1.5 text-xs rounded-full font-semibold ${m.taken ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {m.taken ? <span className="inline-flex items-center gap-1"><FaCheckCircle /> Taken</span> : 'Pending'}
                      </button>
                      <button onClick={() => editMedication(m)} className="text-blue-500 hover:text-blue-700 text-xs">
                        <FaEdit />
                      </button>
                      <button onClick={() => removeMedication(m.id)} className="text-rose-500 hover:text-rose-700 text-xs">
                        <FaTrash />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
        <Card title="Weekly Adherence" subtitle="From persisted adherence logs" icon={FaPills} accent="bg-gradient-to-br from-emerald-500 to-teal-600">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.adherenceWeekly || []}>
                <defs>
                  <linearGradient id="adh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="adherence" stroke="#10b981" fill="url(#adh)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Wait-Time Trend" subtitle="Average expected wait minutes" icon={FaClock} accent="bg-gradient-to-br from-sky-500 to-indigo-600">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.waitTimeTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avgWait" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Insurance Variance" subtitle="Coverage vs out-of-pocket movement" icon={FaShieldAlt} accent="bg-gradient-to-br from-violet-500 to-fuchsia-600">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.insuranceVariance || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="coveredAmount" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outOfPocket" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <Card title="Suite Activity Timeline" subtitle="Recent granular actions across all modules" icon={FaBell} accent="bg-gradient-to-br from-slate-700 to-slate-900">
          <div className="flex flex-wrap gap-2 mb-3">
            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setEventFilter(type);
                  setEventLimit(8);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${eventFilter === type ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {visibleEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No recent activity yet.</p>
            ) : (
              visibleEvents.map((evt) => (
                <div key={evt.id} className="rounded-lg border border-slate-100 px-3 py-2.5 bg-white flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{evt.message}</p>
                    <p className="text-xs text-slate-500">{evt.type}</p>
                  </div>
                  <p className="text-xs text-slate-400 whitespace-nowrap">{new Date(evt.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
          {suiteEvents.filter((evt) => eventFilter === 'ALL' || evt.type === eventFilter).length > visibleEvents.length && (
            <button
              onClick={() => setEventLimit((prev) => prev + 8)}
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Show more
            </button>
          )}
        </Card>
      </div>

      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

export default AdvancedHealthSuite;
