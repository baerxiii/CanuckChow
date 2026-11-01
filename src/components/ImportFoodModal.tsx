import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
  FileCode,
  Sparkles,
  Database,
  Image,
  Loader2,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { CanadianChainId, FoodCategory, MenuItem } from '../types/nutrition';
import { CANADIAN_CHAINS, CATEGORY_LABELS, MENU_DATABASE } from '../data/canadianChains';
import { formatCAD } from '../utils/storage';

interface ImportFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomItem: (item: MenuItem) => void;
  onBulkImport: (items: MenuItem[]) => void;
  customItemsCount: number;
}

export const ImportFoodModal: React.FC<ImportFoodModalProps> = ({
  isOpen,
  onClose,
  onAddCustomItem,
  onBulkImport,
  customItemsCount,
}) => {
  const [activeTab, setActiveTab] = useState<'pamphlet' | 'create' | 'json'>('pamphlet');

  // --- PAMPHLET SCANNER STATE ---
  const [pamphletChainId, setPamphletChainId] = useState<CanadianChainId>('tim-hortons');
  const [pamphletText, setPamphletText] = useState('');
  const [pamphletImageBase64, setPamphletImageBase64] = useState<string | null>(null);
  const [pamphletImageMime, setPamphletImageMime] = useState<string | null>(null);
  const [pamphletImageName, setPamphletImageName] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<MenuItem[]>([]);
  const [selectedItemsToPort, setSelectedItemsToPort] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- SINGLE ITEM FORM STATE ---
  const [name, setName] = useState('');
  const [chainId, setChainId] = useState<CanadianChainId>('tim-hortons');
  const [customChainName, setCustomChainName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('burgers');
  const [servingSize, setServingSize] = useState('1 serving (200g)');
  const [priceCAD, setPriceCAD] = useState<number | ''>(8.99);
  const [calories, setCalories] = useState<number | ''>(450);
  const [protein, setProtein] = useState<number | ''>(25);
  const [totalFat, setTotalFat] = useState<number | ''>(18);
  const [saturatedFat, setSaturatedFat] = useState<number | ''>(6);
  const [carbs, setCarbs] = useState<number | ''>(45);
  const [fiber, setFiber] = useState<number | ''>(3);
  const [sugars, setSugars] = useState<number | ''>(5);
  const [sodium, setSodium] = useState<number | ''>(850);
  const [description, setDescription] = useState('');
  const [isCanadianClassic, setIsCanadianClassic] = useState(false);

  // --- JSON IMPORT STATE ---
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Pamphlet file upload (Image / Scan)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setScanError('Please upload an image file (PNG, JPG, WebP) of the nutritional pamphlet.');
      return;
    }

    setScanError(null);
    setPamphletImageName(file.name);
    setPamphletImageMime(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setPamphletImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setPamphletImageBase64(null);
    setPamphletImageMime(null);
    setPamphletImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run AI or text table parser on the pamphlet
  const handleScanPamphlet = async () => {
    if (!pamphletText.trim() && !pamphletImageBase64) {
      setScanError('Please either upload a pamphlet photo or paste pamphlet text/table.');
      return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      const response = await fetch('/api/parse-pamphlet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: pamphletText.trim(),
          imageBase64: pamphletImageBase64,
          mimeType: pamphletImageMime,
          defaultChainId: pamphletChainId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan pamphlet.');
      }

      if (!data.items || data.items.length === 0) {
        throw new Error('No menu items could be detected from the pamphlet. Try pasting clearer table text.');
      }

      const formatted: MenuItem[] = data.items.map((item: any, idx: number) => ({
        id: `pamphlet-${Date.now()}-${idx}`,
        chainId: pamphletChainId,
        name: item.name || `Pamphlet Item ${idx + 1}`,
        category: (item.category as FoodCategory) || 'burgers',
        servingSize: item.servingSize || '1 serving',
        priceCAD: Number(item.priceCAD) || 7.99,
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        totalFat: Number(item.totalFat) || 0,
        saturatedFat: Number(item.saturatedFat) || 0,
        carbs: Number(item.carbs) || 0,
        fiber: Number(item.fiber) || 0,
        sugars: Number(item.sugars) || 0,
        sodium: Number(item.sodium) || 0,
        description: item.description,
        isCanadianClassic: Boolean(item.isCanadianClassic),
        tags: [...(item.tags || []), 'Pamphlet Ported'],
        isCustom: true
      }));

      setExtractedItems(formatted);

      // Select all by default
      const initialSelection: Record<string, boolean> = {};
      formatted.forEach(i => { initialSelection[i.id] = true; });
      setSelectedItemsToPort(initialSelection);

    } catch (err: any) {
      setScanError(err.message || 'An error occurred while scanning the pamphlet.');
    } finally {
      setIsScanning(false);
    }
  };

  // Port selected items into the user's permanent database
  const handlePortExtractedItems = () => {
    const toPort = extractedItems.filter(i => selectedItemsToPort[i.id]);
    if (toPort.length === 0) {
      setScanError('Please select at least one item to port into your database.');
      return;
    }

    onBulkImport(toPort);
    setImportSuccess(`Successfully ported ${toPort.length} items from the pamphlet into your Canadian database!`);
    setTimeout(() => {
      setImportSuccess(null);
      setExtractedItems([]);
      setPamphletText('');
      handleClearImage();
      onClose();
    }, 1500);
  };

  const handleLoadSamplePamphlet = () => {
    setPamphletText(`TIM HORTONS CANADA - OFFICIAL NUTRITION TABLE (EXCERPT)
Item Name                      Serving(g)  Cals  Fat(g)  SatFat(g)  Carb(g)  Fiber(g)  Sugar(g)  Protein(g)  Sodium(mg)
Maple Dip Donut               80g         210   6       2.5        36       1         19        3           210
Honey Cruller                 65g         310   19      9          31       1         16        2           160
Sour Cream Glazed Donut       95g         340   17      7          44       1         25        3           290
Everything Bagel Plain        105g        280   2       0.5        56       3         6         9           480
Loaded Crispy Chicken Wrap    290g        580   26      8          54       4         6         32          1380
Steeped Tea (Double Double)   424ml       190   9       6          26       0         24        2           35`);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: MenuItem = {
      id: `custom-${Date.now()}`,
      chainId: chainId,
      name: name.trim(),
      category,
      servingSize: servingSize.trim() || '1 serving',
      priceCAD: Number(priceCAD) || 0,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      totalFat: Number(totalFat) || 0,
      saturatedFat: Number(saturatedFat) || 0,
      carbs: Number(carbs) || 0,
      fiber: Number(fiber) || 0,
      sugars: Number(sugars) || 0,
      sodium: Number(sodium) || 0,
      description: description.trim() || undefined,
      isCanadianClassic,
      tags: ['Custom Entry', customChainName ? customChainName : 'User Added'],
      isCustom: true
    };

    onAddCustomItem(newItem);
    setImportSuccess(`Successfully added "${newItem.name}" to your Canadian fast food database!`);
    setTimeout(() => {
      setImportSuccess(null);
      onClose();
    }, 1500);
  };

  const handleJsonImport = () => {
    setJsonError(null);
    setImportSuccess(null);
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON content must be an array of menu item objects.');
      }

      const validItems: MenuItem[] = [];
      for (const item of parsed) {
        if (!item.name || typeof item.calories !== 'number') {
          throw new Error('Each item must contain at least "name" (string) and "calories" (number).');
        }
        validItems.push({
          id: item.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          chainId: item.chainId || 'custom',
          name: String(item.name),
          category: item.category || 'burgers',
          servingSize: item.servingSize || '1 serving',
          priceCAD: Number(item.priceCAD) || 0,
          calories: Number(item.calories) || 0,
          protein: Number(item.protein) || 0,
          totalFat: Number(item.totalFat) || 0,
          saturatedFat: Number(item.saturatedFat) || 0,
          carbs: Number(item.carbs) || 0,
          fiber: Number(item.fiber) || 0,
          sugars: Number(item.sugars) || 0,
          sodium: Number(item.sodium) || 0,
          description: item.description,
          tags: item.tags || ['Imported'],
          isCustom: true
        });
      }

      onBulkImport(validItems);
      setImportSuccess(`Successfully imported ${validItems.length} food items into your database!`);
      setTimeout(() => {
        setImportSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON format');
    }
  };

  const handleExportDatabase = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(MENU_DATABASE, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'Canadian_Fast_Food_Database.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-red-600" />
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Nutritional Pamphlet Importer & Database
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Port official Canadian chain pamphlets, flyers, or custom food tables directly into your database
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 bg-neutral-50 dark:bg-neutral-800/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pamphlet')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'pamphlet'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Port Nutrition Pamphlet / Flyer</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Custom Item</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Bulk JSON Data</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {importSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          {scanError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* TAB 1: PAMPHLET SCANNER & PORTER */}
          {activeTab === 'pamphlet' && (
            <div className="space-y-5">
              {/* If no items have been scanned yet, show input form */}
              {extractedItems.length === 0 ? (
                <div className="space-y-4">
                  <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                    <p className="font-semibold text-neutral-900 dark:text-white mb-1">
                      How to port Canadian chain pamphlets:
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      1. Upload a photo or scan of a paper brochure (e.g. from Tim Hortons, A&W, or McDonald's tray liner).<br />
                      2. OR paste copied rows/tables directly from an official Canadian nutrition PDF brochure.<br />
                      3. We will extract all items, calories, protein, carbs, fats, and sodium into your database.
                    </p>
                  </div>

                  {/* Target Chain Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Assign Pamphlet Items to Chain:
                      </label>
                      <select
                        value={pamphletChainId}
                        onChange={e => setPamphletChainId(e.target.value as CanadianChainId)}
                        className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                      >
                        {CANADIAN_CHAINS.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        <option value="custom">Custom / Other Canadian Chain</option>
                      </select>
                    </div>

                    {/* Image / Scan Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Upload Pamphlet Photo or Scan (Optional):
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {pamphletImageBase64 ? (
                        <div className="flex items-center justify-between p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs">
                          <span className="truncate max-w-[180px] font-mono text-neutral-700 dark:text-neutral-300">
                            {pamphletImageName}
                          </span>
                          <button
                            type="button"
                            onClick={handleClearImage}
                            className="p-1 text-red-600 hover:text-red-700"
                            title="Remove image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700"
                        >
                          <Image className="w-4 h-4 text-neutral-400" />
                          <span>Choose Pamphlet Image...</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Text / Table Paste Area */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Paste Pamphlet Text / PDF Table:
                      </label>
                      <button
                        type="button"
                        onClick={handleLoadSamplePamphlet}
                        className="text-[11px] text-red-600 hover:underline font-medium"
                      >
                        Paste Sample Canadian Pamphlet Text
                      </button>
                    </div>
                    <textarea
                      value={pamphletText}
                      onChange={e => setPamphletText(e.target.value)}
                      placeholder="Paste raw text or tabular rows copied from a Canadian chain's nutritional PDF or pamphlet here..."
                      rows={6}
                      className="w-full p-3 font-mono text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={isScanning || (!pamphletText.trim() && !pamphletImageBase64)}
                      onClick={handleScanPamphlet}
                      className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm transition-all"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analyzing Pamphlet & Extracting Data...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Scan & Extract Items</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* REVIEW & VERIFICATION TABLE */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        Extracted {extractedItems.length} Items from Pamphlet
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Verify items before porting into your permanent database.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExtractedItems([])}
                      className="text-xs text-neutral-500 hover:text-neutral-900 underline"
                    >
                      Scan Another Pamphlet
                    </button>
                  </div>

                  {/* Table */}
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2.5 w-8">
                            <input
                              type="checkbox"
                              checked={extractedItems.every(i => selectedItemsToPort[i.id])}
                              onChange={e => {
                                const allSelected = e.target.checked;
                                const updated: Record<string, boolean> = {};
                                extractedItems.forEach(i => { updated[i.id] = allSelected; });
                                setSelectedItemsToPort(updated);
                              }}
                              className="rounded text-red-600"
                            />
                          </th>
                          <th className="p-2.5">Item Name</th>
                          <th className="p-2.5 text-right font-mono">Calories</th>
                          <th className="p-2.5 text-right font-mono">Protein</th>
                          <th className="p-2.5 text-right font-mono">Carbs</th>
                          <th className="p-2.5 text-right font-mono">Fat</th>
                          <th className="p-2.5 text-right font-mono">Sodium</th>
                          <th className="p-2.5 text-right font-mono">Est. CAD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                        {extractedItems.map(item => (
                          <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                            <td className="p-2.5">
                              <input
                                type="checkbox"
                                checked={Boolean(selectedItemsToPort[item.id])}
                                onChange={e => {
                                  setSelectedItemsToPort(prev => ({
                                    ...prev,
                                    [item.id]: e.target.checked
                                  }));
                                }}
                                className="rounded text-red-600"
                              />
                            </td>
                            <td className="p-2.5 font-sans font-semibold text-neutral-900 dark:text-white">
                              {item.name}
                              <span className="text-[10px] text-neutral-400 block font-normal">
                                {item.servingSize}
                              </span>
                            </td>
                            <td className="p-2.5 text-right tabular-nums">{item.calories}</td>
                            <td className="p-2.5 text-right tabular-nums text-blue-600 font-bold">{item.protein}g</td>
                            <td className="p-2.5 text-right tabular-nums">{item.carbs}g</td>
                            <td className="p-2.5 text-right tabular-nums">{item.totalFat}g</td>
                            <td className="p-2.5 text-right tabular-nums">{item.sodium}mg</td>
                            <td className="p-2.5 text-right tabular-nums text-emerald-600 font-bold">
                              ${item.priceCAD.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Port Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <span className="text-xs text-neutral-500 font-mono">
                      {Object.values(selectedItemsToPort).filter(Boolean).length} of {extractedItems.length} items selected
                    </span>

                    <button
                      type="button"
                      onClick={handlePortExtractedItems}
                      className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Port Selected Items into Database</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL FORM */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Food / Order Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Halifax Donair, Custom Poutine..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Canadian Chain / Source
                  </label>
                  <select
                    value={chainId}
                    onChange={e => setChainId(e.target.value as CanadianChainId)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg"
                  >
                    <option value="custom">Custom / Local Independent Spot</option>
                    {CANADIAN_CHAINS.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {chainId === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Local Restaurant / Spot Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. King of Donair, Montreal Smoke Meat, Local Poutinerie"
                    value={customChainName}
                    onChange={e => setCustomChainName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as FoodCategory)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Price in CAD ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="8.99"
                    value={priceCAD}
                    onChange={e => setPriceCAD(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Serving Size / Weight
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 wrap (250g)"
                    value={servingSize}
                    onChange={e => setServingSize(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Nutritional Specs */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-3">
                <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider block">
                  Nutritional Values (Health Canada standard)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-neutral-500 block mb-0.5 font-semibold">Calories (kcal) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={calories}
                      onChange={e => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-500 block mb-0.5 font-semibold">Protein (g) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={protein}
                      onChange={e => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-500 block mb-0.5 font-semibold">Carbs (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={carbs}
                      onChange={e => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-500 block mb-0.5 font-semibold">Fat (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={totalFat}
                      onChange={e => setTotalFat(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="text-[11px] text-neutral-500 block mb-0.5">Sodium (mg)</label>
                    <input
                      type="number"
                      min="0"
                      value={sodium}
                      onChange={e => setSodium(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-500 block mb-0.5">Fiber (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={fiber}
                      onChange={e => setFiber(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-500 block mb-0.5">Sugars (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={sugars}
                      onChange={e => setSugars(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Description / Custom Modifications
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extra patty, no sweet sauce, whole wheat pita..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="classic-check"
                  checked={isCanadianClassic}
                  onChange={e => setIsCanadianClassic(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="classic-check" className="text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Tag as 🍁 Canadian Classic
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
                >
                  Save to Fast Food Database
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: JSON IMPORT/EXPORT */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  Paste an array of custom nutritional items formatted in JSON, or export your full dataset.
                </p>
                <button
                  type="button"
                  onClick={handleExportDatabase}
                  className="flex items-center gap-1 text-xs text-neutral-700 dark:text-neutral-300 hover:text-red-600 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Full JSON</span>
                </button>
              </div>

              {jsonError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              <textarea
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder='[
  {
    "name": "Halifax Donair",
    "chainId": "custom",
    "category": "pizza-pitas",
    "calories": 780,
    "protein": 42,
    "carbs": 68,
    "totalFat": 32,
    "sodium": 1480,
    "priceCAD": 12.50
  }
]'
                rows={10}
                className="w-full p-3 font-mono text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 text-neutral-900 dark:text-neutral-100"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleJsonImport}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Items Now</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
