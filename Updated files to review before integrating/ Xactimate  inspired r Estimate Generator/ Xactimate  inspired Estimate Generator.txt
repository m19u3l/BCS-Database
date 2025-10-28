import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Download, Search, Calculator, FileText, Home } from 'lucide-react';

const EstimateGenerator = () => {
  const [claimInfo, setClaimInfo] = useState({
    claimNumber: '',
    insured: '',
    address: '',
    adjuster: '',
    dateOfLoss: '',
    carrierClaimNumber: ''
  });

  const [selectedCategory, setSelectedCategory] = useState('water');
  const [searchTerm, setSearchTerm] = useState('');
  const [lineItems, setLineItems] = useState([]);

  // Extensive service database organized by category
  const serviceDatabase = {
    water: {
      name: 'Water Damage',
      items: [
        { code: 'WTR001', name: 'Water Extraction - Light', unit: 'SF', price: 0.45 },
        { code: 'WTR002', name: 'Water Extraction - Heavy', unit: 'SF', price: 0.85 },
        { code: 'WTR003', name: 'Carpet Drying', unit: 'SF', price: 0.35 },
        { code: 'WTR004', name: 'Hardwood Floor Drying', unit: 'SF', price: 1.25 },
        { code: 'WTR005', name: 'Air Mover - Per Day', unit: 'DAY', price: 35.00 },
        { code: 'WTR006', name: 'Dehumidifier - Large - Per Day', unit: 'DAY', price: 65.00 },
        { code: 'WTR007', name: 'Dehumidifier - Small - Per Day', unit: 'DAY', price: 45.00 },
        { code: 'WTR008', name: 'Moisture Monitoring - Per Day', unit: 'DAY', price: 95.00 },
        { code: 'WTR009', name: 'Wall Cavity Drying', unit: 'LF', price: 3.50 },
        { code: 'WTR010', name: 'Ceiling Cavity Drying', unit: 'SF', price: 1.85 },
        { code: 'WTR011', name: 'Antimicrobial Treatment', unit: 'SF', price: 0.75 },
        { code: 'WTR012', name: 'Content Manipulation - Per Room', unit: 'EA', price: 125.00 },
        { code: 'WTR013', name: 'Wet Insulation Removal', unit: 'SF', price: 0.95 },
        { code: 'WTR014', name: 'Subflooring Drying', unit: 'SF', price: 1.15 }
      ]
    },
    demolition: {
      name: 'Demolition',
      items: [
        { code: 'DEM001', name: 'Drywall Removal - Non-Asbestos', unit: 'SF', price: 0.85 },
        { code: 'DEM002', name: 'Drywall Removal - 2 Layers', unit: 'SF', price: 1.25 },
        { code: 'DEM003', name: 'Baseboard Removal', unit: 'LF', price: 0.95 },
        { code: 'DEM004', name: 'Crown Molding Removal', unit: 'LF', price: 1.15 },
        { code: 'DEM005', name: 'Carpet Removal & Disposal', unit: 'SY', price: 2.25 },
        { code: 'DEM006', name: 'Vinyl Flooring Removal', unit: 'SF', price: 0.95 },
        { code: 'DEM007', name: 'Hardwood Flooring Removal', unit: 'SF', price: 1.85 },
        { code: 'DEM008', name: 'Tile Flooring Removal', unit: 'SF', price: 2.45 },
        { code: 'DEM009', name: 'Cabinet Removal - Base', unit: 'LF', price: 8.50 },
        { code: 'DEM010', name: 'Cabinet Removal - Wall', unit: 'LF', price: 6.75 },
        { code: 'DEM011', name: 'Countertop Removal', unit: 'SF', price: 3.25 },
        { code: 'DEM012', name: 'Insulation Removal - Batt', unit: 'SF', price: 0.85 },
        { code: 'DEM013', name: 'Insulation Removal - Blown', unit: 'SF', price: 1.15 },
        { code: 'DEM014', name: 'Ceiling Texture Removal', unit: 'SF', price: 1.25 },
        { code: 'DEM015', name: 'Door & Frame Removal', unit: 'EA', price: 45.00 },
        { code: 'DEM016', name: 'Window Removal', unit: 'EA', price: 85.00 }
      ]
    },
    reconstruction: {
      name: 'Reconstruction',
      items: [
        { code: 'REC001', name: 'Drywall Installation - 1/2"', unit: 'SF', price: 1.85 },
        { code: 'REC002', name: 'Drywall Installation - 5/8"', unit: 'SF', price: 2.15 },
        { code: 'REC003', name: 'Drywall Finishing - Level 4', unit: 'SF', price: 0.95 },
        { code: 'REC004', name: 'Drywall Finishing - Level 5', unit: 'SF', price: 1.35 },
        { code: 'REC005', name: 'Texture Application - Knockdown', unit: 'SF', price: 0.65 },
        { code: 'REC006', name: 'Texture Application - Orange Peel', unit: 'SF', price: 0.55 },
        { code: 'REC007', name: 'Paint - Interior Wall - 1 Coat', unit: 'SF', price: 0.85 },
        { code: 'REC008', name: 'Paint - Interior Wall - 2 Coats', unit: 'SF', price: 1.45 },
        { code: 'REC009', name: 'Paint - Ceiling - 1 Coat', unit: 'SF', price: 0.95 },
        { code: 'REC010', name: 'Baseboard Installation - Colonial', unit: 'LF', price: 3.85 },
        { code: 'REC011', name: 'Crown Molding Installation', unit: 'LF', price: 5.25 },
        { code: 'REC012', name: 'Door Casing Installation', unit: 'EA', price: 85.00 },
        { code: 'REC013', name: 'Insulation Installation - R-13', unit: 'SF', price: 0.85 },
        { code: 'REC014', name: 'Insulation Installation - R-19', unit: 'SF', price: 1.15 },
        { code: 'REC015', name: 'Insulation Installation - R-30', unit: 'SF', price: 1.45 }
      ]
    },
    flooring: {
      name: 'Flooring',
      items: [
        { code: 'FLR001', name: 'Carpet Installation - Standard', unit: 'SY', price: 18.50 },
        { code: 'FLR002', name: 'Carpet Installation - Premium', unit: 'SY', price: 28.50 },
        { code: 'FLR003', name: 'Carpet Pad - 6 lb', unit: 'SY', price: 4.25 },
        { code: 'FLR004', name: 'Carpet Pad - 8 lb', unit: 'SY', price: 5.85 },
        { code: 'FLR005', name: 'Vinyl Plank Installation', unit: 'SF', price: 4.85 },
        { code: 'FLR006', name: 'Laminate Installation', unit: 'SF', price: 3.95 },
        { code: 'FLR007', name: 'Hardwood Installation - Nail Down', unit: 'SF', price: 8.50 },
        { code: 'FLR008', name: 'Hardwood Installation - Glue Down', unit: 'SF', price: 9.25 },
        { code: 'FLR009', name: 'Hardwood Refinishing', unit: 'SF', price: 4.25 },
        { code: 'FLR010', name: 'Tile Installation - Ceramic', unit: 'SF', price: 8.95 },
        { code: 'FLR011', name: 'Tile Installation - Porcelain', unit: 'SF', price: 10.50 },
        { code: 'FLR012', name: 'Tile Installation - Natural Stone', unit: 'SF', price: 12.95 },
        { code: 'FLR013', name: 'Subfloor Installation - Plywood', unit: 'SF', price: 3.25 },
        { code: 'FLR014', name: 'Underlayment Installation', unit: 'SF', price: 1.85 }
      ]
    },
    cabinets: {
      name: 'Cabinets & Countertops',
      items: [
        { code: 'CAB001', name: 'Base Cabinet - Stock', unit: 'LF', price: 185.00 },
        { code: 'CAB002', name: 'Base Cabinet - Semi-Custom', unit: 'LF', price: 295.00 },
        { code: 'CAB003', name: 'Base Cabinet - Custom', unit: 'LF', price: 425.00 },
        { code: 'CAB004', name: 'Wall Cabinet - Stock', unit: 'LF', price: 165.00 },
        { code: 'CAB005', name: 'Wall Cabinet - Semi-Custom', unit: 'LF', price: 265.00 },
        { code: 'CAB006', name: 'Wall Cabinet - Custom', unit: 'LF', price: 385.00 },
        { code: 'CAB007', name: 'Countertop - Laminate', unit: 'SF', price: 28.50 },
        { code: 'CAB008', name: 'Countertop - Granite', unit: 'SF', price: 65.00 },
        { code: 'CAB009', name: 'Countertop - Quartz', unit: 'SF', price: 75.00 },
        { code: 'CAB010', name: 'Countertop - Marble', unit: 'SF', price: 85.00 },
        { code: 'CAB011', name: 'Backsplash - Ceramic Tile', unit: 'SF', price: 12.50 },
        { code: 'CAB012', name: 'Backsplash - Glass Tile', unit: 'SF', price: 18.95 }
      ]
    },
    mold: {
      name: 'Mold Remediation',
      items: [
        { code: 'MLD001', name: 'Mold Testing - Air Sample', unit: 'EA', price: 125.00 },
        { code: 'MLD002', name: 'Mold Testing - Surface Sample', unit: 'EA', price: 95.00 },
        { code: 'MLD003', name: 'Containment Setup - Small Area', unit: 'EA', price: 425.00 },
        { code: 'MLD004', name: 'Containment Setup - Large Area', unit: 'EA', price: 850.00 },
        { code: 'MLD005', name: 'Negative Air Machine - Per Day', unit: 'DAY', price: 85.00 },
        { code: 'MLD006', name: 'HEPA Vacuuming', unit: 'SF', price: 0.85 },
        { code: 'MLD007', name: 'Mold Removal - Drywall', unit: 'SF', price: 3.25 },
        { code: 'MLD008', name: 'Mold Removal - Wood Framing', unit: 'SF', price: 2.85 },
        { code: 'MLD009', name: 'Antimicrobial Application', unit: 'SF', price: 0.95 },
        { code: 'MLD010', name: 'Encapsulation - Clear', unit: 'SF', price: 1.25 },
        { code: 'MLD011', name: 'Post-Remediation Testing', unit: 'EA', price: 150.00 },
        { code: 'MLD012', name: 'Clearance Testing', unit: 'EA', price: 175.00 }
      ]
    },
    fire: {
      name: 'Fire & Smoke Damage',
      items: [
        { code: 'FIR001', name: 'Soot Cleaning - Light', unit: 'SF', price: 0.85 },
        { code: 'FIR002', name: 'Soot Cleaning - Heavy', unit: 'SF', price: 1.85 },
        { code: 'FIR003', name: 'Smoke Odor Removal - Ozone', unit: 'DAY', price: 125.00 },
        { code: 'FIR004', name: 'Smoke Odor Removal - Hydroxyl', unit: 'DAY', price: 95.00 },
        { code: 'FIR005', name: 'Thermal Fogging', unit: 'SF', price: 0.45 },
        { code: 'FIR006', name: 'HVAC Cleaning - Duct', unit: 'LF', price: 8.50 },
        { code: 'FIR007', name: 'Content Cleaning - Soft Goods', unit: 'LB', price: 3.25 },
        { code: 'FIR008', name: 'Content Cleaning - Hard Goods', unit: 'EA', price: 8.50 },
        { code: 'FIR009', name: 'Smoke Seal Primer', unit: 'SF', price: 0.65 },
        { code: 'FIR010', name: 'Charred Material Removal', unit: 'SF', price: 2.45 }
      ]
    },
    plumbing: {
      name: 'Plumbing',
      items: [
        { code: 'PLM001', name: 'Water Line Repair - 1/2"', unit: 'LF', price: 18.50 },
        { code: 'PLM002', name: 'Water Line Repair - 3/4"', unit: 'LF', price: 22.50 },
        { code: 'PLM003', name: 'Drain Line Repair - 2"', unit: 'LF', price: 28.50 },
        { code: 'PLM004', name: 'Drain Line Repair - 4"', unit: 'LF', price: 38.50 },
        { code: 'PLM005', name: 'Water Heater Replacement - 40 Gal', unit: 'EA', price: 1250.00 },
        { code: 'PLM006', name: 'Water Heater Replacement - 50 Gal', unit: 'EA', price: 1450.00 },
        { code: 'PLM007', name: 'Toilet Replacement - Standard', unit: 'EA', price: 385.00 },
        { code: 'PLM008', name: 'Sink Replacement - Vanity', unit: 'EA', price: 425.00 },
        { code: 'PLM009', name: 'Faucet Replacement', unit: 'EA', price: 285.00 },
        { code: 'PLM010', name: 'Garbage Disposal Installation', unit: 'EA', price: 325.00 }
      ]
    },
    electrical: {
      name: 'Electrical',
      items: [
        { code: 'ELC001', name: 'Outlet Replacement', unit: 'EA', price: 85.00 },
        { code: 'ELC002', name: 'Switch Replacement', unit: 'EA', price: 75.00 },
        { code: 'ELC003', name: 'Light Fixture Installation', unit: 'EA', price: 125.00 },
        { code: 'ELC004', name: 'Ceiling Fan Installation', unit: 'EA', price: 185.00 },
        { code: 'ELC005', name: 'Circuit Breaker Replacement - Single', unit: 'EA', price: 125.00 },
        { code: 'ELC006', name: 'Circuit Breaker Replacement - Double', unit: 'EA', price: 185.00 },
        { code: 'ELC007', name: 'GFCI Outlet Installation', unit: 'EA', price: 125.00 },
        { code: 'ELC008', name: 'Smoke Detector Installation', unit: 'EA', price: 95.00 },
        { code: 'ELC009', name: 'Wiring - Romex 14-2', unit: 'LF', price: 3.25 },
        { code: 'ELC010', name: 'Wiring - Romex 12-2', unit: 'LF', price: 3.85 }
      ]
    },
    roofing: {
      name: 'Roofing',
      items: [
        { code: 'RFG001', name: 'Shingle Replacement - 3-Tab', unit: 'SQ', price: 385.00 },
        { code: 'RFG002', name: 'Shingle Replacement - Architectural', unit: 'SQ', price: 485.00 },
        { code: 'RFG003', name: 'Underlayment - Felt', unit: 'SQ', price: 45.00 },
        { code: 'RFG004', name: 'Underlayment - Synthetic', unit: 'SQ', price: 85.00 },
        { code: 'RFG005', name: 'Ice & Water Shield', unit: 'SQ', price: 95.00 },
        { code: 'RFG006', name: 'Drip Edge Installation', unit: 'LF', price: 3.25 },
        { code: 'RFG007', name: 'Ridge Vent Installation', unit: 'LF', price: 8.50 },
        { code: 'RFG008', name: 'Valley Flashing', unit: 'LF', price: 12.50 },
        { code: 'RFG009', name: 'Roof Deck Repair - Plywood', unit: 'SF', price: 4.25 },
        { code: 'RFG010', name: 'Roof Deck Repair - OSB', unit: 'SF', price: 3.85 }
      ]
    }
  };

  const filteredItems = useMemo(() => {
    const items = serviceDatabase[selectedCategory]?.items || [];
    if (!searchTerm) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedCategory, searchTerm]);

  const addLineItem = (item) => {
    setLineItems([...lineItems, {
      ...item,
      id: Date.now(),
      quantity: 1,
      notes: ''
    }]);
  };

  const updateLineItem = (id, field, value) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeLineItem = (id) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTax = (subtotal) => subtotal * 0.08;
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + calculateTax(subtotal);
  };

  const generateReport = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const total = calculateTotal();

    let report = `INSURANCE CLAIM ESTIMATE\n`;
    report += `${'='.repeat(80)}\n\n`;
    report += `CLAIM INFORMATION:\n`;
    report += `Claim Number: ${claimInfo.claimNumber}\n`;
    report += `Insured: ${claimInfo.insured}\n`;
    report += `Property Address: ${claimInfo.address}\n`;
    report += `Adjuster: ${claimInfo.adjuster}\n`;
    report += `Date of Loss: ${claimInfo.dateOfLoss}\n`;
    report += `Carrier Claim #: ${claimInfo.carrierClaimNumber}\n`;
    report += `Estimate Date: ${new Date().toLocaleDateString()}\n\n`;
    report += `${'-'.repeat(80)}\n`;
    report += `LINE ITEMS:\n`;
    report += `${'-'.repeat(80)}\n\n`;

    const groupedItems = {};
    lineItems.forEach(item => {
      const category = Object.keys(serviceDatabase).find(key =>
        serviceDatabase[key].items.some(i => i.code === item.code)
      );
      if (!groupedItems[category]) {
        groupedItems[category] = [];
      }
      groupedItems[category].push(item);
    });

    Object.entries(groupedItems).forEach(([category, items]) => {
      report += `\n${serviceDatabase[category].name.toUpperCase()}\n`;
      report += `${'-'.repeat(80)}\n`;
      items.forEach(item => {
        const lineTotal = item.quantity * item.price;
        report += `${item.code} - ${item.name}\n`;
        report += `  Qty: ${item.quantity} ${item.unit} @ $${item.price.toFixed(2)} = $${lineTotal.toFixed(2)}\n`;
        if (item.notes) {
          report += `  Notes: ${item.notes}\n`;
        }
        report += `\n`;
      });
    });

    report += `${'-'.repeat(80)}\n`;
    report += `SUMMARY:\n`;
    report += `${'-'.repeat(80)}\n`;
    report += `Subtotal: $${subtotal.toFixed(2)}\n`;
    report += `Tax (8%): $${tax.toFixed(2)}\n`;
    report += `TOTAL: $${total.toFixed(2)}\n`;

    return report;
  };

  const downloadReport = () => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estimate_${claimInfo.claimNumber || 'draft'}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">Insurance Claims Estimate Generator</h1>
                <p className="text-blue-100 mt-1">Professional Remediation & Reconstruction Estimating</p>
              </div>
            </div>
            <FileText className="w-12 h-12 opacity-50" />
          </div>
        </div>

        {/* Claim Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Claim Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Claim Number"
              value={claimInfo.claimNumber}
              onChange={(e) => setClaimInfo({ ...claimInfo, claimNumber: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Insured Name"
              value={claimInfo.insured}
              onChange={(e) => setClaimInfo({ ...claimInfo, insured: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Property Address"
              value={claimInfo.address}
              onChange={(e) => setClaimInfo({ ...claimInfo, address: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Adjuster Name"
              value={claimInfo.adjuster}
              onChange={(e) => setClaimInfo({ ...claimInfo, adjuster: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
            <input
              type="date"
              placeholder="Date of Loss"
              value={claimInfo.dateOfLoss}
              onChange={(e) => setClaimInfo({ ...claimInfo, dateOfLoss: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Carrier Claim Number"
              value={claimInfo.carrierClaimNumber}
              onChange={(e) => setClaimInfo({ ...claimInfo, carrierClaimNumber: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Database */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Service Database</h2>
            
            {/* Category Selection */}
            <div className="mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                {Object.entries(serviceDatabase).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* Service List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredItems.map((item) => (
                <div
                  key={item.code}
                  className="p-3 border border-gray-200 rounded hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => addLineItem(item)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-mono text-gray-500">{item.code}</span>
                    <span className="text-sm font-bold text-blue-600">${item.price}</span>
                  </div>
                  <div className="text-sm text-gray-800 font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-1">Per {item.unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Estimate Worksheet */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Estimate Worksheet
              </h2>
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {lineItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Click items from the service database to add them to your estimate</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lineItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{item.code}</span>
                          <span className="font-semibold text-gray-800">{item.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">Unit: {item.unit} | Price: ${item.price.toFixed(2)}</div>
                      </div>
                      <button
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Line Total</label>
                        <div className="text-lg font-bold text-blue-600 bg-blue-50 rounded px-3 py-2">
                          ${(item.quantity * item.price).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="text-xs text-gray-600 block mb-1">Notes</label>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateLineItem(item.id, 'notes', e.target.value)}
                        placeholder="Add notes or details..."
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ))}

                {/* Summary */}
                <div className="border-t-2 border-gray-300 pt-4 mt-6">
                  <div className="space-y-2 text-right">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Tax (8%):</span>
                      <span>${calculateTax(calculateSubtotal()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold text-blue-600 pt-2 border-t border-gray-300">
                      <span>TOTAL:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateGenerator;