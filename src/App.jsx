import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Calendar, DollarSign, User, Building, Phone, Mail, FileText, Check, X, Printer, Send, Settings, ChevronDown, Users, MapPin, AlertTriangle, Loader, QrCode, Copy, ExternalLink, Link as LinkIcon, RefreshCw, Trash2, Download, Database, Globe, Plus, Image as ImageIcon, Type, Lock, Percent, Edit2, Upload, RotateCcw, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, deleteDoc, onSnapshot, query, orderBy, updateDoc } from "firebase/firestore";

// ==============================================================================
// 🔒 ADMIN CONFIGURATION (HARDCODE YOUR KEYS HERE)
// ==============================================================================

const CONST_GOOGLE_MAPS_KEY = "AIzaSyBZkZwy9O2THIjqA-liZJCPAuoawV0kDvw"; 
const CONST_WEBHOOK_URL = "";
const CONST_FIREBASE_CONFIG = {
  apiKey: "AIzaSyASgtk7IbBZbOVDMtGvlZtQWeO0ezgljQc",
  authDomain: "prd-offer-tool.firebaseapp.com",
  projectId: "prd-offer-tool",
  storageBucket: "prd-offer-tool.firebasestorage.app",
  messagingSenderId: "124641181600",
  appId: "1:124641181600:web:89b578ca25243ec89d2ec5"
};

// ==============================================================================

const ORIGINAL_DEFAULT_LOGO = "https://prdburleighheads.com.au/wp-content/uploads/2025/01/PRD-B.T-LAND-RED-PNG.png";

const DEFAULT_PLACEHOLDERS = {
  purchasePrice: '',
  depositAmount: '',
  depositPercent: '',
  depositTerms: 'Payable immediately',
  financeDate: '14 days from contract date',
  inspectionDate: '14 days from contract date',
  settlementDate: '30 days from contract date',
  specialConditions: 'e.g. Subject to sale of existing property...'
};

const DEFAULT_AGENTS = [
  { name: 'General Office', email: 'admin@prdburleighheads.com.au' }
];

// --- Helper: Calculate deposit from percentage ---
const calculateDeposit = (price, percent) => {
  const numPrice = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  const numPercent = parseFloat(percent);
  if (isNaN(numPrice) || isNaN(numPercent)) return '';
  return Math.round(numPrice * (numPercent / 100)).toLocaleString();
};

// --- Helper: Format currency ---
const formatCurrency = (value) => {
  const num = String(value).replace(/[^0-9]/g, '');
  if (!num) return '';
  return parseInt(num).toLocaleString();
};

// --- Components ---

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 border-b-2 border-slate-800 pb-2 mb-4 mt-8">
    <Icon className="w-5 h-5 text-red-600" />
    <h2 className="text-lg font-bold uppercase tracking-wider text-slate-800">{title}</h2>
  </div>
);

const InputField = ({ label, name, type = "text", value, onChange, placeholder, className = "", required = false, inputRef, icon: Icon, readOnly = false, prefix }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
        {Icon && <Icon className="w-3 h-3 text-slate-400" />}
    </label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">{prefix}</span>
      )}
      <input
        ref={inputRef}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`border rounded p-2 text-sm focus:outline-none transition-colors w-full ${
          prefix ? 'pl-7' : ''
        } ${
          readOnly 
            ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' 
            : 'border-slate-300 focus:ring-2 focus:ring-red-600'
        }`}
        autoComplete={name === "propertyAddress" ? "off" : "on"}
        id={name} 
      />
    </div>
  </div>
);

const Checkbox = ({ label, name, checked, onChange }) => (
  <div className="flex items-center gap-2 mt-4 cursor-pointer" onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}>
    <div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${checked ? 'bg-red-600 border-red-600' : 'border-slate-300 bg-white'}`}>
      {checked && <Check className="w-3 h-3 text-white" />}
    </div>
    <span className="text-sm font-medium text-slate-700 select-none">{label}</span>
  </div>
);

const SignaturePad = ({ onEnd, onClear, signatureData }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'black';
    }
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      onEnd(canvas.toDataURL());
    }
  };

  const clear = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <div className="relative w-full h-40 border-2 border-dashed border-slate-300 rounded bg-slate-50 hover:bg-white transition-colors touch-none">
       {!signatureData && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm">Sign Here</div>}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
      />
      <button type="button" onClick={clear} className="absolute top-2 right-2 p-1 bg-white shadow rounded hover:text-red-600 text-slate-500" title="Clear Signature">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [formData, setFormData] = useState({
    agentName: '',
    agentEmail: '',
    propertyAddress: '',
    buyerName1: '',
    buyerName2: '',
    buyerAddress: '',
    buyerPhone: '',
    buyerEmail: '',
    solicitorCompany: '',
    solicitorContact: '',
    solicitorEmail: '',
    purchasePrice: '',
    depositAmount: '',
    depositTerms: '',
    financeDate: '',
    financePreApproved: false,
    inspectionDate: '',
    settlementDate: '',
    specialConditions: '',
    signature: null,
    signature2: null,
    signatureDate1: new Date().toISOString().split('T')[0],
    signatureDate2: new Date().toISOString().split('T')[0]
  });

  // --- Infrastructure State ---
  const [googleApiKey] = useState(CONST_GOOGLE_MAPS_KEY);
  const [webhookUrl] = useState(CONST_WEBHOOK_URL);
  const [firebaseConfig] = useState(CONST_FIREBASE_CONFIG);

  // --- UI State ---
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState('qr');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const ADMIN_PASSWORD = "PRD";
  
  // --- Data State ---
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(null);
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [agentsList, setAgentsList] = useState(DEFAULT_AGENTS);
  const [logoUrl, setLogoUrl] = useState(ORIGINAL_DEFAULT_LOGO);
  const [defaultLogoUrl, setDefaultLogoUrl] = useState(ORIGINAL_DEFAULT_LOGO);
  const [placeholders, setPlaceholders] = useState(DEFAULT_PLACEHOLDERS);

  // --- Admin UI State ---
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentPhoto, setNewAgentPhoto] = useState('');
  const [tempLogoUrl, setTempLogoUrl] = useState('');
  const [tempPlaceholders, setTempPlaceholders] = useState(DEFAULT_PLACEHOLDERS);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoGallery, setLogoGallery] = useState([]);
  const [newLogoName, setNewLogoName] = useState('');
  
  // --- Edit Agent State ---
  const [editingAgent, setEditingAgent] = useState(null);
  const [editAgentName, setEditAgentName] = useState('');
  const [editAgentEmail, setEditAgentEmail] = useState('');
  const [editAgentPhoto, setEditAgentPhoto] = useState('');

  // --- Agent Mode (QR) State ---
  const [agentModeData, setAgentModeData] = useState({ agentName: '', propertyAddress: '' });
  const [shortLink, setShortLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [agentModeReady, setAgentModeReady] = useState(false);
  
  // --- Refs ---
  const addressInputRef = useRef(null);
  const agentAddressInputRef = useRef(null);
  const autocompleteInstance = useRef(null);
  const agentAutocompleteInstance = useRef(null);
  const dbRef = useRef(null);
  const logoInputRef = useRef(null);
  const formContainerRef = useRef(null);

  // --- Validation State ---
  const [validationErrors, setValidationErrors] = useState([]);

  // ============================================================
  // INITIALIZATION
  // ============================================================

  useEffect(() => {
    if (firebaseConfig && !dbRef.current) {
      try {
        const app = initializeApp(firebaseConfig);
        dbRef.current = getFirestore(app);
        console.log("Firebase Connected");

        const qAgents = query(collection(dbRef.current, "agents"), orderBy("name"));
        const unsubAgents = onSnapshot(qAgents, (snap) => {
          if(!snap.empty) {
             const loaded = snap.docs.map(d => ({id: d.id, ...d.data()}));
             setAgentsList(loaded);
          }
        });

        // Listen for logo gallery
        const qLogos = query(collection(dbRef.current, "logos"), orderBy("uploadedAt", "desc"));
        const unsubLogos = onSnapshot(qLogos, (snap) => {
          const loaded = snap.docs.map(d => ({id: d.id, ...d.data()}));
          // If no logos exist, add the default
          if (loaded.length === 0) {
            addDoc(collection(dbRef.current, "logos"), {
              name: "Default Logo",
              url: ORIGINAL_DEFAULT_LOGO,
              isDefault: true,
              uploadedAt: new Date().toISOString()
            });
          } else {
            setLogoGallery(loaded);
          }
        });

        const docRef = doc(dbRef.current, "config", "settings");
        const unsubSettings = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            if (data.defaultLogoUrl) {
              setDefaultLogoUrl(data.defaultLogoUrl);
            }
            if (data.logoUrl) {
               setLogoUrl(data.logoUrl);
               setTempLogoUrl(data.logoUrl);
            } else {
               setLogoUrl(ORIGINAL_DEFAULT_LOGO);
               setTempLogoUrl(ORIGINAL_DEFAULT_LOGO);
            }
            if (data.placeholders) {
               setPlaceholders(prev => ({...prev, ...data.placeholders}));
               setTempPlaceholders(prev => ({...prev, ...data.placeholders}));
            }
          } else {
            // No settings doc exists - create one with default logo
            await setDoc(docRef, { 
              defaultLogoUrl: ORIGINAL_DEFAULT_LOGO,
              logoUrl: ORIGINAL_DEFAULT_LOGO,
              placeholders: DEFAULT_PLACEHOLDERS
            });
            setDefaultLogoUrl(ORIGINAL_DEFAULT_LOGO);
            setLogoUrl(ORIGINAL_DEFAULT_LOGO);
            setTempLogoUrl(ORIGINAL_DEFAULT_LOGO);
          }
        });

        return () => { unsubAgents(); unsubSettings(); unsubLogos(); };
      } catch(e) {
        console.error("Firebase Init Error:", e);
      }
    }
  }, [firebaseConfig]);

  useEffect(() => {
    if (!googleApiKey) return;
    
    window.initGoogleMaps = () => { setIsMapsLoaded(true); setMapsError(null); };
    window.gm_authFailure = () => { setMapsError("Invalid Maps Key"); setIsMapsLoaded(false); };

    if (window.google && window.google.maps && window.google.maps.places) { setIsMapsLoaded(true); return; }
    if (document.getElementById('gmaps-script')) return;

    const script = document.createElement('script');
    script.id = 'gmaps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => setMapsError("Network Error (Maps)");
    document.head.appendChild(script);
  }, [googleApiKey]);

  const initAutocomplete = (inputRef, instanceRef, callback) => {
    if (isMapsLoaded && !mapsError && inputRef.current && !instanceRef.current) {
      try {
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'], componentRestrictions: { country: 'au' }, fields: ['formatted_address']
        });
        instanceRef.current = ac;
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (place.formatted_address) callback(place.formatted_address);
        });
      } catch(e) { console.error(e); }
    }
  };

  useEffect(() => {
    if (!isPrefilled) initAutocomplete(addressInputRef, autocompleteInstance, (addr) => setFormData(prev => ({ ...prev, propertyAddress: addr })));
  }, [isMapsLoaded, mapsError, isPrefilled]);

  useEffect(() => {
    if (showAdminPanel && adminTab === 'qr' && isMapsLoaded && !mapsError) {
      agentAutocompleteInstance.current = null;
      setAgentModeReady(false);
      
      const timer = setTimeout(() => {
        if (agentAddressInputRef.current && !agentAutocompleteInstance.current) {
          try {
            const ac = new window.google.maps.places.Autocomplete(agentAddressInputRef.current, {
              types: ['address'], componentRestrictions: { country: 'au' }, fields: ['formatted_address']
            });
            agentAutocompleteInstance.current = ac;
            ac.addListener('place_changed', () => {
              const place = ac.getPlace();
              if (place.formatted_address) {
                setAgentModeData(prev => ({ ...prev, propertyAddress: place.formatted_address }));
                setShortLink('');
                setQrGenerated(false);
              }
            });
            setAgentModeReady(true);
          } catch(e) { console.error("Agent Kiosk autocomplete error:", e); }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showAdminPanel, adminTab, isMapsLoaded, mapsError]);

  useEffect(() => {
    const loadFromUrl = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      
      if (id && dbRef.current) {
        setIsPrefilled(true); 
        try {
          const snap = await getDoc(doc(dbRef.current, "shortlinks", id));
          if (snap.exists()) {
            const data = snap.data();
            const agentEmail = agentsList.find(a => a.name === data.agent)?.email || '';
            setFormData(prev => ({ ...prev, agentName: data.agent || '', agentEmail, propertyAddress: data.address || '' }));
          }
        } catch (e) { console.error(e); }
      } else {
        const agent = params.get('agent') || params.get('a');
        const address = params.get('address') || params.get('p');
        if (agent || address) {
          setIsPrefilled(true);
          const agentEmail = agentsList.find(a => a.name === agent)?.email || '';
          setFormData(prev => ({ ...prev, agentName: agent || '', agentEmail, propertyAddress: address || '' }));
        }
      }
    };
    setTimeout(loadFromUrl, 800);
  }, [agentsList]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const checkAdminAccess = (callback) => {
    if (adminUnlocked) {
      callback();
      return;
    }
    const entered = prompt("Enter admin password:");
    if (entered === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      callback();
    } else if (entered !== null) {
      alert("Incorrect password");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Clear validation errors when user starts editing
    if (validationErrors.length > 0) setValidationErrors([]);
    
    if (name === 'purchasePrice' || name === 'depositAmount') {
      setFormData(prev => ({ ...prev, [name]: formatCurrency(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleAgentChange = (e) => {
    if (validationErrors.length > 0) setValidationErrors([]);
    const selected = agentsList.find(a => a.name === e.target.value);
    setFormData(prev => ({ ...prev, agentName: e.target.value, agentEmail: selected ? selected.email : '' }));
  };

  const handleSignatureEnd = (field, dataUrl) => {
    if (validationErrors.length > 0) setValidationErrors([]);
    setFormData(prev => ({ ...prev, [field]: dataUrl }));
  };
  const handleSignatureClear = (field) => setFormData(prev => ({ ...prev, [field]: null }));
  
  const handlePrint = () => window.print();

  const validateForm = () => {
    const errors = [];
    
    // Required fields
    if (!formData.agentName) errors.push('Selling Agent');
    if (!formData.propertyAddress) errors.push('Property Address');
    if (!formData.buyerName1) errors.push('Buyer Full Name (1)');
    if (!formData.buyerAddress) errors.push('Buyer Postal Address');
    if (!formData.buyerPhone) errors.push('Buyer Phone');
    if (!formData.buyerEmail) errors.push('Buyer Email');
    if (!formData.purchasePrice) errors.push('Purchase Price');
    
    // Deposit - either entered or has placeholder
    if (!formData.depositAmount && !placeholders.depositAmount && !placeholders.depositPercent) {
      errors.push('Initial Deposit');
    }
    
    // Dates - either entered or has placeholder
    if (!formData.financeDate && !placeholders.financeDate) errors.push('Finance Date');
    if (!formData.inspectionDate && !placeholders.inspectionDate) errors.push('Inspection Date');
    if (!formData.settlementDate && !placeholders.settlementDate) errors.push('Settlement Date');
    
    // Signature required
    if (!formData.signature) errors.push('Buyer 1 Signature');
    
    // If there's a second buyer, they need to sign too
    if (formData.buyerName2 && !formData.signature2) {
      errors.push('Buyer 2 Signature');
    }
    
    return errors;
  };

  const generatePDF = async () => {
    if (!formContainerRef.current) return null;
    
    try {
      // Temporarily show print styles for PDF capture
      const container = formContainerRef.current;
      
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: container.scrollWidth,
        height: container.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      // Calculate if we need multiple pages
      const scaledHeight = imgHeight * ratio;
      const pageHeight = pdfHeight;
      let heightLeft = scaledHeight;
      let position = 0;
      
      // First page
      pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, scaledHeight);
      heightLeft -= pageHeight;
      
      // Additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, scaledHeight);
        heightLeft -= pageHeight;
      }
      
      // Return as base64
      return pdf.output('datauristring').split(',')[1];
    } catch (e) {
      console.error('PDF generation error:', e);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors([]);
    
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    
    // Generate PDF
    let pdfBase64 = null;
    try {
      pdfBase64 = await generatePDF();
    } catch (e) {
      console.error('PDF Error:', e);
    }
    
    // Prepare payload with all form data and PDF
    const payload = { 
      ...formData,
      // Use placeholders if fields are empty
      depositAmount: formData.depositAmount || (placeholders.depositPercent && formData.purchasePrice 
        ? calculateDeposit(formData.purchasePrice, placeholders.depositPercent) 
        : placeholders.depositAmount) || '',
      depositTerms: formData.depositTerms || placeholders.depositTerms,
      financeDate: formData.financeDate || placeholders.financeDate,
      inspectionDate: formData.inspectionDate || placeholders.inspectionDate,
      settlementDate: formData.settlementDate || placeholders.settlementDate,
      submittedAt: new Date().toISOString(),
      // Include PDF as base64
      pdfBase64: pdfBase64,
      pdfFilename: `Offer_${formData.propertyAddress.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}_${new Date().toISOString().split('T')[0]}.pdf`
    };

    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(payload) 
        });
        if (res.ok) { 
          setSubmitStatus('success'); 
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        else { setSubmitStatus('error'); alert("Failed to send."); }
      } catch (e) { setSubmitStatus('error'); alert("Network Error"); }
    } else {
      // Demo mode - just show success
      setTimeout(() => { 
        setSubmitStatus('success'); 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
      }, 1000);
    }
    setIsSubmitting(false);
  };

  const generateSmartLink = async () => {
    if (!agentModeData.agentName || !agentModeData.propertyAddress) return;
    setIsGeneratingLink(true);
    let finalUrl = '';

    if (dbRef.current) {
      try {
        const uniqueId = Math.random().toString(36).substring(2, 7);
        await setDoc(doc(dbRef.current, "shortlinks", uniqueId), {
          agent: agentModeData.agentName,
          address: agentModeData.propertyAddress,
          createdAt: new Date().toISOString()
        });
        finalUrl = `${window.location.origin}${window.location.pathname}?id=${uniqueId}`;
      } catch (e) { alert("DB Error. Check console."); }
    }
    
    if (!finalUrl) {
      finalUrl = `${window.location.origin}${window.location.pathname}?a=${encodeURIComponent(agentModeData.agentName)}&p=${encodeURIComponent(agentModeData.propertyAddress)}`;
    }

    setShortLink(finalUrl);
    setIsGeneratingLink(false);
    setQrGenerated(true);
  };

  const handleSaveSettings = async () => {
    if (!dbRef.current) { alert("Database not connected."); return; }
    try {
      await setDoc(doc(dbRef.current, "config", "settings"), { 
        logoUrl: tempLogoUrl,
        placeholders: tempPlaceholders
      }, { merge: true });
      alert("Settings Saved!");
    } catch (e) { alert("Save failed."); console.error(e); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    if (!dbRef.current) {
      alert("Firebase Database not connected. Please refresh the page.");
      return;
    }
    
    // Check file size (max 800KB for Firestore)
    if (file.size > 800000) {
      alert("Logo file is too large. Please use an image under 800KB.");
      return;
    }
    
    const logoName = newLogoName.trim() || `Logo ${new Date().toLocaleDateString()}`;
    
    setIsUploadingLogo(true);
    
    try {
      console.log("Converting to base64:", file.name);
      
      // Convert file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      console.log("Adding to gallery...");
      
      // Add to logo gallery (storing base64 directly)
      await addDoc(collection(dbRef.current, "logos"), {
        name: logoName,
        url: base64,
        isDefault: false,
        uploadedAt: new Date().toISOString()
      });
      
      setTempLogoUrl(base64);
      setNewLogoName('');
      console.log("Upload complete!");
      alert("Logo uploaded! Select it below and click 'Save Settings' to apply.");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSelectLogo = (url) => {
    setTempLogoUrl(url);
  };

  const handleDeleteLogo = async (logoId, isDefault) => {
    if (isDefault) {
      alert("Cannot delete the default logo.");
      return;
    }
    if (!window.confirm("Delete this logo?")) return;
    
    try {
      await deleteDoc(doc(dbRef.current, "logos", logoId));
    } catch (e) {
      console.error(e);
      alert("Delete failed.");
    }
  };

  const handleAddAgent = async () => {
    if (!newAgentName || !newAgentEmail || !dbRef.current) return;
    try {
      await addDoc(collection(dbRef.current, "agents"), { 
        name: newAgentName, 
        email: newAgentEmail,
        photo: newAgentPhoto || ''
      });
      setNewAgentName(''); 
      setNewAgentEmail('');
      setNewAgentPhoto('');
    } catch(e) { alert("Add failed."); }
  };

  const handleEditAgent = (agent) => {
    setEditingAgent(agent.id);
    setEditAgentName(agent.name);
    setEditAgentEmail(agent.email);
    setEditAgentPhoto(agent.photo || '');
  };

  const handleSaveAgent = async () => {
    if (!editingAgent || !dbRef.current) return;
    try {
      await updateDoc(doc(dbRef.current, "agents", editingAgent), {
        name: editAgentName,
        email: editAgentEmail,
        photo: editAgentPhoto
      });
      setEditingAgent(null);
    } catch(e) { alert("Update failed."); }
  };

  const handleCancelEdit = () => {
    setEditingAgent(null);
  };

  const handleDeleteAgent = async (id) => {
    if (!dbRef.current || !id) return;
    if(window.confirm("Remove Agent?")) await deleteDoc(doc(dbRef.current, "agents", id));
  };

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(shortLink || 'https://prdburleigh.com')}&ecc=L&margin=2&format=png`;
  
  const downloadQr = async () => {
    try {
      const res = await fetch(qrApiUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fname = agentModeData.propertyAddress.replace(/[^a-z0-9]/gi, '_').substring(0, 15);
      link.download = `QR_${fname}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch(e) { window.open(qrApiUrl, '_blank'); }
  };

  const getDepositPlaceholder = () => {
    if (placeholders.depositAmount) return placeholders.depositAmount;
    if (placeholders.depositPercent) {
      if (formData.purchasePrice) {
        const calc = calculateDeposit(formData.purchasePrice, placeholders.depositPercent);
        if (calc) return `${calc} (${placeholders.depositPercent}% of purchase price)`;
      }
      return `Enter purchase price to calculate ${placeholders.depositPercent}%`;
    }
    return '';
  };

  const hasSecondBuyer = formData.buyerName2 && formData.buyerName2.trim().length > 0;
  const selectedAgent = agentsList.find(a => a.name === formData.agentName);

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white text-slate-800 font-sans relative">
      <style>{`.pac-container { z-index: 10000 !important; }`}</style>

      {/* NAVBAR */}
      <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md print:hidden">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Logo" className="h-8 w-auto bg-white p-1 rounded" />
            <span className="font-bold tracking-tight ml-2 hidden sm:inline">Offer Form</span>
          </div>
          {!isPrefilled && (
            <div className="flex gap-2">
               <button onClick={() => checkAdminAccess(() => {
                  setAgentModeData({
                    agentName: formData.agentName || '',
                    propertyAddress: formData.propertyAddress || ''
                  });
                  setShortLink('');
                  setQrGenerated(false);
                  setShowAdminPanel(true);
                  setAdminTab('qr');
                })} className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded transition text-sm font-bold">
                <Lock className="w-3 h-3" /> Admin
              </button>
              <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded transition font-medium text-sm">
                <Printer className="w-4 h-4" /><span className="hidden sm:inline">Print</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ADMIN PANEL */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-4 flex justify-between items-center shrink-0">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-500" /> Admin Panel
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div title="Maps API" className={`w-2 h-2 rounded-full ${googleApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div title="Webhook" className={`w-2 h-2 rounded-full ${webhookUrl ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div title="Database" className={`w-2 h-2 rounded-full ${dbRef.current ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <button onClick={() => { 
                  setShowAdminPanel(false); 
                  agentAutocompleteInstance.current = null;
                  setAgentModeReady(false);
                  setEditingAgent(null);
                }} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="bg-slate-100 border-b border-slate-200 flex shrink-0">
              <button onClick={() => setAdminTab('qr')} className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition ${adminTab === 'qr' ? 'bg-white text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <QrCode className="w-4 h-4" /> QR Generator
              </button>
              <button onClick={() => setAdminTab('settings')} className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition ${adminTab === 'settings' ? 'bg-white text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button onClick={() => setAdminTab('team')} className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition ${adminTab === 'team' ? 'bg-white text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <Users className="w-4 h-4" /> Team
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              
              {adminTab === 'qr' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">Generate a QR code link for your open home.</p>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Agent</label>
                      <select className="w-full border border-slate-300 rounded p-2 text-sm" value={agentModeData.agentName} onChange={(e) => { setAgentModeData(p => ({...p, agentName: e.target.value})); setQrGenerated(false); }}>
                        <option value="">-- Select --</option>
                        {agentsList.map(a => (<option key={a.id || a.name} value={a.name}>{a.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                        Address {agentModeReady && <MapPin className="w-3 h-3 text-green-500" />}
                      </label>
                      <input ref={agentAddressInputRef} type="text" className="w-full border border-slate-300 rounded p-2 text-sm" placeholder={agentModeReady ? "Start typing address..." : "Loading..."} value={agentModeData.propertyAddress} onChange={(e) => { setAgentModeData(p => ({...p, propertyAddress: e.target.value})); setQrGenerated(false); }} />
                    </div>
                    <button onClick={generateSmartLink} disabled={!agentModeData.agentName || !agentModeData.propertyAddress || isGeneratingLink} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white py-3 rounded text-sm font-bold mt-2 flex items-center justify-center gap-2">
                      {isGeneratingLink ? <Loader className="w-4 h-4 animate-spin"/> : <><QrCode className="w-4 h-4"/> Generate QR</>}
                    </button>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center p-4 min-h-[300px]">
                    {qrGenerated ? (
                      <div className="flex flex-col items-center w-full">
                        <div className="bg-white p-2 rounded shadow mb-3 border border-slate-100">
                          <img src={qrApiUrl} alt="QR" className="w-40 h-40" />
                        </div>
                        <div className="text-xs font-mono text-slate-500 bg-white border rounded px-2 py-1 mb-3 w-full truncate text-center">{shortLink}</div>
                        <div className="flex gap-2 w-full">
                          <button onClick={() => { navigator.clipboard.writeText(shortLink); alert("Copied!"); }} className="flex-1 bg-white border hover:bg-slate-50 py-2 rounded text-xs font-bold flex items-center justify-center gap-1"><Copy className="w-3 h-3"/> Copy</button>
                          <button onClick={downloadQr} className="flex-1 bg-white border hover:bg-slate-50 py-2 rounded text-xs font-bold flex items-center justify-center gap-1"><Download className="w-3 h-3"/> Save</button>
                        </div>
                        <a href={shortLink} target="_blank" rel="noreferrer" className="w-full mt-2 bg-slate-900 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-black"><ExternalLink className="w-3 h-3"/> Open Form</a>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-center">
                        <QrCode className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">Select Agent & Address<br/>to generate code.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Logo</h3>
                    
                    {/* Current Logo Preview */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-32 h-16 bg-slate-100 border-2 border-red-500 rounded flex items-center justify-center p-2">
                        <img src={tempLogoUrl || defaultLogoUrl} alt="Current Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-700 mb-1">Currently Selected</p>
                        <p className="text-xs text-slate-500">Click a logo below to select it, then Save Settings.</p>
                      </div>
                    </div>
                    
                    {/* Logo Gallery */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                      <p className="text-xs font-bold text-slate-600 mb-2">Available Logos</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                        {logoGallery.map((logo) => (
                          <div 
                            key={logo.id} 
                            className={`relative group cursor-pointer rounded border-2 p-1 transition-all ${
                              tempLogoUrl === logo.url 
                                ? 'border-red-500 bg-red-50' 
                                : 'border-slate-200 hover:border-slate-400 bg-white'
                            }`}
                            onClick={() => handleSelectLogo(logo.url)}
                          >
                            <div className="h-10 flex items-center justify-center">
                              <img src={logo.url} alt={logo.name} className="max-h-full max-w-full object-contain" />
                            </div>
                            <p className="text-[10px] text-slate-500 truncate text-center mt-1">{logo.name}</p>
                            {tempLogoUrl === logo.url && (
                              <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5">
                                <Check className="w-2 h-2 text-white" />
                              </div>
                            )}
                            {!logo.isDefault && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteLogo(logo.id, logo.isDefault); }}
                                className="absolute -top-1 -left-1 bg-white border border-slate-300 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-300"
                              >
                                <X className="w-2 h-2 text-red-500" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Upload New Logo */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1"><Plus className="w-3 h-3" /> Upload New Logo</p>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-xs text-slate-500 block mb-1">Logo Name</label>
                          <input 
                            type="text" 
                            value={newLogoName} 
                            onChange={(e) => setNewLogoName(e.target.value)} 
                            className="w-full border border-slate-300 rounded p-1.5 text-sm" 
                            placeholder="e.g. Christmas 2025" 
                          />
                        </div>
                        <div>
                          <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                          <button 
                            onClick={() => logoInputRef.current?.click()} 
                            disabled={isUploadingLogo} 
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
                          >
                            {isUploadingLogo ? <Loader className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Type className="w-4 h-4" /> Form Placeholders</h3>
                    <p className="text-xs text-slate-500 mb-3">Leave empty for no placeholder.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Purchase Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                          <input type="text" value={tempPlaceholders.purchasePrice || ''} onChange={(e) => setTempPlaceholders(p => ({...p, purchasePrice: formatCurrency(e.target.value)}))} className="w-full border border-slate-300 rounded p-2 pl-7 text-sm" placeholder="e.g. 1,500,000" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1 flex items-center gap-1">
                          Deposit Amount <span className="text-slate-400">OR</span> Percentage
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input type="text" value={tempPlaceholders.depositAmount || ''} onChange={(e) => setTempPlaceholders(p => ({...p, depositAmount: formatCurrency(e.target.value), depositPercent: ''}))} className="w-full border border-slate-300 rounded p-2 pl-7 text-sm" placeholder="e.g. 50,000" />
                          </div>
                          <div className="relative w-24">
                            <input type="number" value={tempPlaceholders.depositPercent || ''} onChange={(e) => setTempPlaceholders(p => ({...p, depositPercent: e.target.value, depositAmount: ''}))} className="w-full border border-slate-300 rounded p-2 pr-6 text-sm" placeholder="%" min="0" max="100" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">% auto-calculates based on purchase price</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Deposit Terms</label>
                        <input type="text" value={tempPlaceholders.depositTerms || ''} onChange={(e) => setTempPlaceholders(p => ({...p, depositTerms: e.target.value}))} className="w-full border border-slate-300 rounded p-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Finance Date</label>
                        <input type="text" value={tempPlaceholders.financeDate || ''} onChange={(e) => setTempPlaceholders(p => ({...p, financeDate: e.target.value}))} className="w-full border border-slate-300 rounded p-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Building & Pest Inspection</label>
                        <input type="text" value={tempPlaceholders.inspectionDate || ''} onChange={(e) => setTempPlaceholders(p => ({...p, inspectionDate: e.target.value}))} className="w-full border border-slate-300 rounded p-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Settlement Date</label>
                        <input type="text" value={tempPlaceholders.settlementDate || ''} onChange={(e) => setTempPlaceholders(p => ({...p, settlementDate: e.target.value}))} className="w-full border border-slate-300 rounded p-2 text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-slate-500 block mb-1">Special Conditions</label>
                        <input type="text" value={tempPlaceholders.specialConditions || ''} onChange={(e) => setTempPlaceholders(p => ({...p, specialConditions: e.target.value}))} className="w-full border border-slate-300 rounded p-2 text-sm" />
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-bold">Save Settings</button>
                </div>
              )}

              {adminTab === 'team' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Manage your team members.</p>
                  
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="max-h-80 overflow-y-auto">
                      {agentsList.map((a, i) => (
                        <div key={a.id || i} className="border-b border-slate-100 last:border-b-0">
                          {editingAgent === a.id ? (
                            // Edit Mode
                            <div className="p-3 bg-blue-50 space-y-2">
                              <div className="flex items-center gap-2">
                                {editAgentPhoto ? (
                                  <img src={editAgentPhoto} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                    <User className="w-5 h-5" />
                                  </div>
                                )}
                                <input type="text" value={editAgentName} onChange={(e) => setEditAgentName(e.target.value)} className="flex-1 border border-slate-300 rounded p-1.5 text-sm" placeholder="Name" />
                              </div>
                              <input type="email" value={editAgentEmail} onChange={(e) => setEditAgentEmail(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" placeholder="Email" />
                              <input type="text" value={editAgentPhoto} onChange={(e) => setEditAgentPhoto(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" placeholder="Photo URL" />
                              <div className="flex gap-2">
                                <button onClick={handleSaveAgent} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1">
                                  <Check className="w-3 h-3" /> Save
                                </button>
                                <button onClick={handleCancelEdit} className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1">
                                  <X className="w-3 h-3" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <div className="flex items-center gap-3 p-3 hover:bg-slate-50">
                              {a.photo ? (
                                <img src={a.photo} alt={a.name} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                  <User className="w-5 h-5" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-800 truncate">{a.name}</div>
                                <div className="text-xs text-slate-500 truncate">{a.email}</div>
                              </div>
                              {a.id && (
                                <div className="flex gap-1">
                                  <button onClick={() => handleEditAgent(a)} className="text-slate-400 hover:text-blue-600 p-1" title="Edit">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteAgent(a.id)} className="text-slate-400 hover:text-red-500 p-1" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">Add New Agent</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input type="text" placeholder="Name" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} className="border border-slate-300 rounded p-2 text-sm" />
                      <input type="email" placeholder="Email" value={newAgentEmail} onChange={(e) => setNewAgentEmail(e.target.value)} className="border border-slate-300 rounded p-2 text-sm" />
                      <input type="text" placeholder="Photo URL (optional)" value={newAgentPhoto} onChange={(e) => setNewAgentPhoto(e.target.value)} className="border border-slate-300 rounded p-2 text-sm" />
                    </div>
                    <button onClick={handleAddAgent} disabled={!newAgentName || !newAgentEmail} className="mt-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add Agent
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN FORM */}
      <div ref={formContainerRef} className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none min-h-screen">
        <header className="p-8 pb-4 border-b border-slate-200 flex justify-between items-start print:p-0 print:mb-8">
          <div><img src={logoUrl} alt="Logo" className="h-16 w-auto mb-2" /></div>
          <div className="text-right">
             <h2 className="text-2xl font-bold uppercase text-slate-800">Offer to Purchase</h2>
             <p className="text-sm text-slate-500">Official Letter of Offer</p>
             {formData.agentName && (
               <div className="flex items-center justify-end gap-2 mt-2">
                 {selectedAgent?.photo && (
                   <img src={selectedAgent.photo} alt={formData.agentName} className="w-8 h-8 rounded-full object-cover" />
                 )}
                 <p className="text-xs text-slate-600 font-medium bg-slate-100 p-1 rounded">Agent: {formData.agentName}</p>
               </div>
             )}
          </div>
        </header>

        {/* VALIDATION ERRORS */}
        {validationErrors.length > 0 && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg print:hidden">
            <div className="flex items-start gap-3">
              <div className="bg-red-100 p-2 rounded-full text-red-600"><AlertCircle className="w-5 h-5" /></div>
              <div>
                <h3 className="font-bold text-red-800">Please complete the following required fields:</h3>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {submitStatus === 'success' && (
          <div className="mx-8 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 print:hidden">
            <div className="bg-green-100 p-2 rounded-full text-green-600"><Check className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-green-800">Offer Submitted Successfully!</h3>
              <p className="text-sm text-green-700 mt-1">Your offer has been sent to the agent and a copy has been emailed to you.</p>
              <div className="flex gap-3 mt-2">
                <button onClick={() => window.print()} className="text-xs font-bold text-green-800 hover:text-green-900 underline flex items-center gap-1">
                  <Printer className="w-3 h-3" /> Print a Copy
                </button>
                {!isPrefilled && (
                  <button onClick={() => window.location.reload()} className="text-xs font-bold text-green-800 hover:text-green-900 underline">Create New Offer</button>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 pt-4 print:p-0">
          {!isPrefilled && (
            <div className="bg-slate-50 p-4 rounded border border-slate-200 mb-6 print:hidden">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Select Selling Agent</label>
              <select className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600" onChange={handleAgentChange} value={formData.agentName} required>
                <option value="">-- Please Select Agent --</option>
                {agentsList.map((a, i) => (<option key={a.id || i} value={a.name}>{a.name}</option>))}
              </select>
            </div>
          )}

          <SectionHeader icon={Building} title="Property Details" />
          <div className="grid grid-cols-1 gap-4">
             <InputField label="Property Address" name="propertyAddress" value={formData.propertyAddress} onChange={handleChange} placeholder={isMapsLoaded && !mapsError ? "Start typing address..." : "e.g. 4D/238 The Esplanade"} className="w-full" required readOnly={isPrefilled} inputRef={addressInputRef} icon={isMapsLoaded && !mapsError ? MapPin : null} />
          </div>

          <SectionHeader icon={User} title="Buyer Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Buyer Full Name (1)" name="buyerName1" value={formData.buyerName1} onChange={handleChange} required />
            <InputField label="Buyer Full Name (2)" name="buyerName2" value={formData.buyerName2} onChange={handleChange} />
            <InputField label="Current Postal Address" name="buyerAddress" value={formData.buyerAddress} onChange={handleChange} className="md:col-span-2" required />
            <InputField label="Phone / Mobile" name="buyerPhone" value={formData.buyerPhone} onChange={handleChange} required />
            <InputField label="Email Address" name="buyerEmail" type="email" value={formData.buyerEmail} onChange={handleChange} required />
          </div>

          <SectionHeader icon={FileText} title="Buyer's Solicitor" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Company Name" name="solicitorCompany" value={formData.solicitorCompany} onChange={handleChange} placeholder="TBA if unknown" />
            <InputField label="Contact Person" name="solicitorContact" value={formData.solicitorContact} onChange={handleChange} />
            <InputField label="Email / Phone" name="solicitorEmail" value={formData.solicitorEmail} onChange={handleChange} className="md:col-span-2" />
          </div>

          <SectionHeader icon={DollarSign} title="Price & Deposit" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField label="Purchase Price Offer" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} placeholder={placeholders.purchasePrice || ''} required prefix="$" />
            <InputField label="Initial Deposit" name="depositAmount" value={formData.depositAmount} onChange={handleChange} placeholder={getDepositPlaceholder()} prefix="$" />
            <InputField label="Deposit Terms" name="depositTerms" value={formData.depositTerms} onChange={handleChange} placeholder={placeholders.depositTerms || ''} />
          </div>

          <SectionHeader icon={Calendar} title="Conditions" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                <h3 className="font-bold text-slate-700 mb-3 text-sm">Finance</h3>
                <InputField label="Finance Date" name="financeDate" value={formData.financeDate} onChange={handleChange} placeholder={placeholders.financeDate || ''} className="mb-3" />
                <Checkbox label="Loan Pre-Approved?" name="financePreApproved" checked={formData.financePreApproved} onChange={handleChange} />
             </div>
             <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                <h3 className="font-bold text-slate-700 mb-3 text-sm">Building & Pest</h3>
                <InputField label="Inspection Date" name="inspectionDate" value={formData.inspectionDate} onChange={handleChange} placeholder={placeholders.inspectionDate || ''} />
             </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
             <InputField label="Settlement Date" name="settlementDate" value={formData.settlementDate} onChange={handleChange} placeholder={placeholders.settlementDate || ''} />
          </div>

          <div className="mt-6">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Special Conditions</label>
            <textarea name="specialConditions" value={formData.specialConditions} onChange={handleChange} rows={4} className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors" placeholder={placeholders.specialConditions || ''}></textarea>
          </div>

          <div className="mt-12 mb-8 break-inside-avoid">
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-4">
               <div className="flex items-center gap-2"><PenTool className="w-5 h-5 text-red-600" /><h2 className="text-lg font-bold uppercase tracking-wider text-slate-800">Authorisation</h2></div>
            </div>
            <div className={`grid grid-cols-1 ${hasSecondBuyer ? 'md:grid-cols-2' : ''} gap-8`}>
              <div className="flex flex-col h-full justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{hasSecondBuyer ? 'Buyer 1 Signature' : 'Buyer Signature'}</label>
                  <div className="print:hidden"><SignaturePad signatureData={formData.signature} onEnd={(data) => handleSignatureEnd('signature', data)} onClear={() => handleSignatureClear('signature')} /></div>
                  <div className="hidden print:block h-32 border-b border-slate-300 relative">{formData.signature && (<img src={formData.signature} alt="Signature 1" className="h-full object-contain absolute bottom-0 left-0" />)}</div>
                </div>
                <div className="mt-4"><InputField label="Date" name="signatureDate1" type="date" value={formData.signatureDate1} onChange={handleChange} /></div>
              </div>
              {hasSecondBuyer && (
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Buyer 2 Signature</label>
                    <div className="print:hidden"><SignaturePad signatureData={formData.signature2} onEnd={(data) => handleSignatureEnd('signature2', data)} onClear={() => handleSignatureClear('signature2')} /></div>
                    <div className="hidden print:block h-32 border-b border-slate-300 relative">{formData.signature2 && (<img src={formData.signature2} alt="Signature 2" className="h-full object-contain absolute bottom-0 left-0" />)}</div>
                  </div>
                   <div className="mt-4"><InputField label="Date" name="signatureDate2" type="date" value={formData.signatureDate2} onChange={handleChange} /></div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end print:hidden">
            <button type="submit" disabled={isSubmitting} className={`flex items-center gap-2 px-8 py-3 rounded text-white font-bold tracking-wide shadow-lg ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 transform hover:-translate-y-0.5 transition-all'}`}>
              {isSubmitting ? 'Sending...' : <>Submit Offer <Send className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      </div>
      <div className="max-w-4xl mx-auto py-8 text-center text-slate-400 text-xs print:hidden"><p>&copy; {new Date().getFullYear()} PRD Real Estate. Powered by Online Offer Form.</p></div>
    </div>
  );
}
