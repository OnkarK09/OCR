import React, { useState, useEffect, useRef } from 'react';

import { Camera, RefreshCw, FileText, CreditCard, ShoppingBag, Check, AlertCircle, X, Wand2, Code, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function App() {

  const [activeTab, setActiveTab] = useState('aadhaar'); // aadhaar, pan, bill

  const [image, setImage] = useState(null);

  const [processedImage, setProcessedImage] = useState(null); // For debugging/OCR

  const [processing, setProcessing] = useState(false);

  const [progress, setProgress] = useState(0);

  const [result, setResult] = useState(null);

  const [jsonResult, setJsonResult] = useState(null); // Store the specific JSON output for PAN

  const [showJson, setShowJson] = useState(false);

  const [error, setError] = useState(null);

  const [tesseractLoaded, setTesseractLoaded] = useState(false);

  const fileInputRef = useRef(null);

  // Load Tesseract.js from CDN

  useEffect(() => {

    const script = document.createElement('script');

    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

    script.async = true;

    script.onload = () => setTesseractLoaded(true);

    script.onerror = () => setError("Failed to load OCR library. Please check your internet connection.");

    document.body.appendChild(script);

    return () => {

      document.body.removeChild(script);

    };

  }, []);

  const handleFileChange = (e) => {

    const file = e.target.files[0];

    if (file) {

      setResult(null);

      setJsonResult(null);

      setError(null);

      const reader = new FileReader();

      reader.onload = (event) => {

        setImage(event.target.result);

        setProcessedImage(null);

      };

      reader.readAsDataURL(file);

    }

  };

  const clearImage = () => {

    setImage(null);

    setProcessedImage(null);

    setResult(null);

    setJsonResult(null);

    setProgress(0);

    setError(null);

    if (fileInputRef.current) fileInputRef.current.value = "";

  };

  // Preprocess image (Grayscale + Contrast)

  const preprocessImage = (imageSrc) => {

    return new Promise((resolve) => {

      const img = new Image();

      img.src = imageSrc;

      img.onload = () => {

        const canvas = document.createElement('canvas');

        const ctx = canvas.getContext('2d');

        canvas.width = img.width;

        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const data = imageData.data;

        

        for (let i = 0; i < data.length; i += 4) {

          const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);

          const contrastFactor = 1.2;

          const contrast = (avg - 128) * contrastFactor + 128;

          const final = Math.min(255, Math.max(0, contrast));

          data[i] = final;

          data[i + 1] = final;

          data[i + 2] = final;

        }

        

        ctx.putImageData(imageData, 0, 0);

        resolve(canvas.toDataURL('image/jpeg'));

      };

    });

  };

  // Helper to crop image region

  const cropImageRegion = async (base64Image, bbox) => {

    return new Promise((resolve) => {

      const img = new Image();

      img.src = base64Image;

      img.onload = () => {

        const canvas = document.createElement('canvas');

        const w = img.width;

        const h = img.height;

        

        const x = bbox.x1 * w;

        const y = bbox.y1 * h;

        const width = (bbox.x2 - bbox.x1) * w;

        const height = (bbox.y2 - bbox.y1) * h;

        canvas.width = width;

        canvas.height = height;

        const ctx = canvas.getContext('2d');

        // Fill white background first

        ctx.fillStyle = "#FFFFFF";

        ctx.fillRect(0,0,width,height);

        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg'));

      };

    });

  };

  // Clean char based on position in PAN (AAAAA1111A)

  const getPanCharDetails = (char, index) => {

    const isDigitPos = (index >= 5 && index <= 8);

    let repaired = char;

    let ambiguity = null;

    if (isDigitPos) {

       // Expecting Digit

       if (/[A-Z]/.test(char)) {

          if (char === 'O' || char === 'o' || char === 'D' || char === 'Q') { repaired = '0'; ambiguity = 'O_vs_0'; }

          else if (char === 'I' || char === 'l' || char === 'L' || char === 'i') { repaired = '1'; ambiguity = 'I_vs_1'; }

          else if (char === 'Z' || char === 'z') { repaired = '2'; ambiguity = 'Z_vs_2'; }

          else if (char === 'S' || char === 's') { repaired = '5'; ambiguity = 'S_vs_5'; }

          else if (char === 'B') { repaired = '8'; ambiguity = 'B_vs_8'; }

       }

    } else {

       // Expecting Letter

       if (/[0-9]/.test(char)) {

          if (char === '0') { repaired = 'O'; ambiguity = 'O_vs_0'; }

          else if (char === '1') { repaired = 'I'; ambiguity = 'I_vs_1'; }

          else if (char === '5') { repaired = 'S'; ambiguity = 'S_vs_5'; }

          else if (char === '8') { repaired = 'B'; ambiguity = 'B_vs_8'; }

          else if (char === '6') { repaired = 'G'; ambiguity = 'G_vs_6'; }

       }

    }

    return { repaired, ambiguity };

  };

  const calculatePatternDistance = (text) => {

    let cost = 0;

    const clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (clean.length !== 10) return 100;

    for (let i = 0; i < 10; i++) {

      const char = clean[i];

      const isDigit = /[0-9]/.test(char);

      const isAlpha = /[A-Z]/.test(char);

      if (i <= 4 || i === 9) { if (!isAlpha) cost += 1; } 

      else { if (!isDigit) cost += 1; }

    }

    return cost;

  };

  const processImage = async () => {

    if (!image || !tesseractLoaded) return;

    

    setProcessing(true);

    setProgress(0);

    setError(null);

    setResult(null);

    setJsonResult(null);

    try {

      setProgress(5);

      const optimizedImage = await preprocessImage(image);

      setProcessedImage(optimizedImage);

      const { createWorker } = window.Tesseract;

      const worker = await createWorker('eng', 1, {

        logger: m => {

          if (m.status === 'recognizing text') {

            setProgress(10 + parseInt(m.progress * 90));

          }

        }

      });

      

      if (activeTab === 'pan') {

        await worker.setParameters({

          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',

        });

      }

      const { data } = await worker.recognize(optimizedImage);

      await worker.terminate();

      if (activeTab === 'pan') {

        const panJson = await analyzePanData(data, optimizedImage);

        setJsonResult(panJson);

        

        if (panJson.best_pan.text) {

          const isHighConf = panJson.best_pan.confidence >= 0.75;

          setResult({

            success: true,

            fields: { 

              'PAN Number': panJson.best_pan.text, 

              'Confidence': (panJson.best_pan.confidence * 100).toFixed(1) + '%',

              'Verdict': isHighConf ? 'Auto-Accepted' : 'Review Required'

            },

            raw: panJson.best_pan.reason,

            isHighConf

          });

        } else {

           setResult({

            success: false,

            fields: { 'Status': 'Failed to detect PAN' },

            raw: 'No valid pattern found.'

          });

        }

      } else {

        const extractedData = extractData(data.text, data.lines, activeTab);

        setResult(extractedData);

      }

    } catch (err) {

      console.error(err);

      setError("An error occurred. Please try a clearer photo.");

    } finally {

      setProcessing(false);

    }

  };

  const analyzePanData = async (tesseractData, imageSrc) => {

    const { words } = tesseractData;

    const candidates = [];

    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;

    

    // Get Image Dims for normalization

    const img = new Image();

    img.src = imageSrc;

    await new Promise(r => img.onload = r);

    const w = img.width;

    const h = img.height;

    for (let word of words) {

      const rawText = word.text;

      const cleanRaw = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');

      

      // Filter strictly by length (8-12) to catch nearly-correct PANs

      if (cleanRaw.length < 8 || cleanRaw.length > 12) continue;

      // Analyze Characters & Ambiguities

      let repairedText = "";

      const ambiguousChars = {};

      

      // Use the first 10 chars of the clean string as the candidate base

      const targetStr = cleanRaw.substring(0, 10);

      

      if (targetStr.length === 10) {

        for (let i = 0; i < 10; i++) {

          const { repaired, ambiguity } = getPanCharDetails(targetStr[i], i);

          repairedText += repaired;

          if (ambiguity) {

            if (!ambiguousChars[ambiguity]) ambiguousChars[ambiguity] = [];

            ambiguousChars[ambiguity].push(targetStr[i]);

          }

        }

      } else {

        repairedText = cleanRaw; // fallback if length mismatch

      }

      const isExactMatch = panRegex.test(repairedText);

      const distance = calculatePatternDistance(repairedText);

      const fuzzyConf = Math.max(0, 1 - (distance / 10));

      // Calculate Normalized Bbox

      const bbox = word.bbox;

      const normalizedBbox = {

        x1: parseFloat((bbox.x0 / w).toFixed(4)),

        y1: parseFloat((bbox.y0 / h).toFixed(4)),

        x2: parseFloat((bbox.x1 / w).toFixed(4)),

        y2: parseFloat((bbox.y1 / h).toFixed(4))

      };

      candidates.push({

        text: rawText,

        filtered_text: repairedText, // Using repaired text for "filtered" to aid selection

        regex_match: isExactMatch,

        regex: isExactMatch ? repairedText : null,

        bbox: normalizedBbox,

        raw_bbox: bbox, // Store raw for cropping

        ocr_confidence: word.confidence / 100,

        fuzzy_distance: distance,

        fuzzy_confidence: fuzzyConf,

        ambiguous_chars: ambiguousChars

      });

    }

    // Determine Best PAN

    let bestCandidate = null;

    let highestScore = -1;

    candidates.forEach(c => {

      // Weighting: Accuracy (regex) > OCR Confidence > Fuzzy Score

      let score = c.ocr_confidence * 0.4 + c.fuzzy_confidence * 0.4;

      if (c.regex_match) score += 0.2; 

      

      // Bonus for clean format (distance 0)

      if (c.fuzzy_distance === 0) score += 0.1;

      // Cap at 1.0

      score = Math.min(1.0, score);

      if (score > highestScore) {

        highestScore = score;

        bestCandidate = c;

      }

    });

    const bestPan = {

      text: bestCandidate ? bestCandidate.filtered_text : null,

      confidence: bestCandidate ? parseFloat(highestScore.toFixed(2)) : 0,

      source_index: candidates.indexOf(bestCandidate),

      source_bbox: bestCandidate ? bestCandidate.bbox : null,

      reason: bestCandidate 

        ? (bestCandidate.regex_match ? "Exact Pattern Match" : `Approximation (Dist: ${bestCandidate.fuzzy_distance})`) 

        : "No PAN pattern found"

    };

    // Crop Image

    const crops = [];

    if (bestCandidate) {

        const cropUrl = await cropImageRegion(imageSrc, bestCandidate.bbox);

        crops.push(cropUrl);

    }

    return {

      image_size: { width: w, height: h },

      preprocessing_actions: ["grayscale", "contrast_enhanced", "whitelist_A-Z0-9", "fuzzy_repair"],

      candidates: candidates.map(c => ({

          text: c.text,

          filtered_text: c.filtered_text,

          regex_match: c.regex_match,

          regex: c.regex,

          bbox: c.bbox,

          ocr_confidence: c.ocr_confidence,

          fuzzy_distance: c.fuzzy_distance,

          fuzzy_confidence: c.fuzzy_confidence,

          ambiguous_chars: c.ambiguous_chars

      })),

      best_pan: bestPan,

      cropped_images_base64: crops

    };

  };

  // Keep Aadhaar/Bill Logic same

  const extractData = (rawText, lines, type) => {

    let data = {

      raw: rawText,

      fields: {},

      success: false

    };

    const cleanText = rawText.replace(/\n/g, " ");

    if (type === 'aadhaar') {

      const aadhaarRegex = /\b\d{4}\s\d{4}\s\d{4}\b/g;

      const matches = cleanText.match(aadhaarRegex);

      if (matches && matches.length > 0) {

        data.fields['Aadhaar Number'] = matches[0];

        data.success = true;

      } else {

         const tightRegex = /\b\d{12}\b/g;

         const tightMatches = cleanText.match(tightRegex);

         if (tightMatches) {

            data.fields['Aadhaar Number'] = tightMatches[0].replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3");

            data.success = true;

         } else {

            data.fields['Status'] = "Could not confidently identify 12-digit UID.";

         }

      }

    } 

    else if (type === 'bill') {

      // Enhanced amount detection with multiple strategies
      const finalTotalKeys = [
        'grand total', 'net amount', 'bill amount', 'total amount', 'final amount',
        'payable', 'paid amount', 'amount payable', 'amount paid', 'amount to pay',
        'total payable', 'net payable', 'final total', 'balance', 'outstanding',
        'round off', 'roundoff', 'round-off', 'to pay', 'pay', 'balance amount'
      ];

      const highPriorityKeys = [
        'total', 'amount', 'sum', 'subtotal', 'bill total', 'invoice total',
        'final', 'net', 'gross total', 'gross amount'
      ];

      // Comprehensive money regex patterns - handles various formats
      const moneyPatterns = [
        /(?:Rs\.?|INR|₹|rupees?)\s*:?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/gi,  // Rs. 1,234.56
        /(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)\s*(?:Rs\.?|INR|₹)/gi,  // 1,234.56 Rs
        /(?:Rs\.?|INR|₹)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,  // Rs 1234.56
        /(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/g,  // Simple: 1,234.56 or 1234.56
        /(\d+\.\d{2})/g,  // Decimal format: 1234.56
        /(\d{4,}(?:\.\d{2})?)/g  // Large numbers without commas: 123456.78
      ];

      let bestAmount = 0;
      let amountSource = '';
      let foundHighPriority = false;
      const allAmounts = [];
      const keywordMatches = [];

      // Helper function to extract amount from text
      const extractAmounts = (text) => {
        const amounts = [];
        for (const pattern of moneyPatterns) {
          const matches = text.match(pattern);
          if (matches) {
            matches.forEach(match => {
              // Extract number from match
              let numStr = match.replace(/[^\d.,]/g, '');
              // Handle Indian number format (lakhs, crores) - remove commas
              numStr = numStr.replace(/,/g, '');
              const num = parseFloat(numStr);
              if (!isNaN(num) && num > 0 && num < 100000000) { // Reasonable range
                amounts.push(num);
              }
            });
          }
        }
        return [...new Set(amounts)]; // Remove duplicates
      };

      // Strategy 1: Look for final total keywords with amounts on same line
      lines.forEach((line, index) => {
        const text = line.text.toLowerCase();
        const originalText = line.text;

        // Extract all amounts from this line
        const amounts = extractAmounts(originalText);
        
        if (amounts.length > 0) {
          const maxLineVal = Math.max(...amounts);
          allAmounts.push({ value: maxLineVal, line: originalText, index, amounts });

          // Check for final total keywords (highest priority)
          const hasFinalKeyword = finalTotalKeys.some(key => {
            const keywordIndex = text.indexOf(key);
            if (keywordIndex !== -1) {
              // Check if amount appears after keyword on same line
              const afterKeyword = originalText.substring(keywordIndex + key.length);
              const amountsAfter = extractAmounts(afterKeyword);
              if (amountsAfter.length > 0) {
                keywordMatches.push({
                  value: Math.max(...amountsAfter),
                  source: 'Final Total (Same Line)',
                  line: originalText,
                  index
                });
                return true;
              }
              // Or use the max amount from the line
              keywordMatches.push({
                value: maxLineVal,
                source: 'Final Total (Same Line)',
                line: originalText,
                index
              });
              return true;
            }
            return false;
          });

          if (hasFinalKeyword) {
            if (maxLineVal > bestAmount || !foundHighPriority) {
              bestAmount = maxLineVal;
              amountSource = 'Final Total';
              foundHighPriority = true;
            }
          }
          // Check for high priority keywords
          else if (!foundHighPriority) {
            const hasHighPriority = highPriorityKeys.some(key => {
              const keywordIndex = text.indexOf(key);
              if (keywordIndex !== -1) {
                const afterKeyword = originalText.substring(keywordIndex + key.length);
                const amountsAfter = extractAmounts(afterKeyword);
                if (amountsAfter.length > 0) {
                  keywordMatches.push({
                    value: Math.max(...amountsAfter),
                    source: 'Total (Same Line)',
                    line: originalText,
                    index
                  });
                  return true;
                }
                keywordMatches.push({
                  value: maxLineVal,
                  source: 'Total (Same Line)',
                  line: originalText,
                  index
                });
                return true;
              }
              return false;
            });

            if (hasHighPriority && maxLineVal > bestAmount) {
              bestAmount = maxLineVal;
              amountSource = 'Total';
            }
          }
        }
      });

      // Strategy 2: Look for amounts on next line after keywords
      lines.forEach((line, index) => {
        if (index < lines.length - 1) {
          const text = line.text.toLowerCase();
          const nextLine = lines[index + 1];
          const nextLineText = nextLine.text;

          const hasKeyword = finalTotalKeys.some(key => text.includes(key)) ||
                           highPriorityKeys.some(key => text.includes(key));

          if (hasKeyword) {
            const amounts = extractAmounts(nextLineText);
            if (amounts.length > 0) {
              const maxVal = Math.max(...amounts);
              if (!foundHighPriority && finalTotalKeys.some(key => text.includes(key))) {
                if (maxVal > bestAmount) {
                  bestAmount = maxVal;
                  amountSource = 'Final Total (Next Line)';
                  foundHighPriority = true;
                }
              } else if (!foundHighPriority && maxVal > bestAmount) {
                bestAmount = maxVal;
                amountSource = 'Total (Next Line)';
              }
            }
          }
        }
      });

      // Strategy 3: Use keyword matches if found
      if (keywordMatches.length > 0 && !foundHighPriority) {
        keywordMatches.sort((a, b) => b.value - a.value);
        const bestMatch = keywordMatches[0];
        if (bestMatch.value > bestAmount) {
          bestAmount = bestMatch.value;
          amountSource = bestMatch.source;
        }
      }

      // Strategy 4: If no keyword match, use the largest amount (usually the total)
      if (!foundHighPriority && allAmounts.length > 0) {
        allAmounts.sort((a, b) => b.value - a.value);
        // Filter out very small amounts (likely item prices)
        const significantAmounts = allAmounts.filter(a => a.value >= 10);
        if (significantAmounts.length > 0) {
          bestAmount = significantAmounts[0].value;
          amountSource = 'Largest Amount';
        } else {
          bestAmount = allAmounts[0].value;
          amountSource = 'Largest Amount';
        }
      }

      // Strategy 5: Look for amounts at the bottom of the bill (usually totals)
      if (!foundHighPriority && allAmounts.length > 0) {
        const bottomAmounts = allAmounts
          .filter(a => a.index >= Math.floor(lines.length * 0.6))
          .sort((a, b) => b.value - a.value);
        
        if (bottomAmounts.length > 0) {
          const bottomAmount = bottomAmounts[0].value;
          // Use bottom amount if it's significant and close to or larger than current best
          if (bottomAmount > bestAmount * 0.7 || (bestAmount === 0 && bottomAmount > 0)) {
            bestAmount = bottomAmount;
            amountSource = 'Bottom Section';
          }
        }
      }

      // Strategy 6: Look for amounts that appear multiple times (likely totals)
      if (!foundHighPriority && allAmounts.length > 0) {
        const amountCounts = {};
        allAmounts.forEach(a => {
          // Round to nearest rupee for grouping
          const rounded = Math.round(a.value);
          if (!amountCounts[rounded]) {
            amountCounts[rounded] = { value: a.value, count: 0, lines: [] };
          }
          amountCounts[rounded].count++;
          amountCounts[rounded].lines.push(a.line);
        });

        // Find amount that appears most often (likely the total)
        let maxCount = 0;
        let mostCommonAmount = 0;
        Object.values(amountCounts).forEach(entry => {
          if (entry.count > maxCount && entry.value > 0) {
            maxCount = entry.count;
            mostCommonAmount = entry.value;
          }
        });

        if (maxCount >= 2 && mostCommonAmount > bestAmount * 0.8) {
          bestAmount = mostCommonAmount;
          amountSource = 'Most Common Amount';
        }
      }

      // Enhanced store/medical/hospital name detection
      const ignoreWords = [
        'tax', 'invoice', 'bill', 'gstin', 'date', 'ph:', 'mo:', 'tin', 'cash', 
        'memo', 'receipt', 'number', 'no.', 'original', 'duplicate', 'reg',
        'amount', 'total', 'subtotal', 'discount', 'gst', 'cgst', 'sgst', 'igst',
        'qty', 'quantity', 'rate', 'price', 'item', 'description', 'particulars',
        's.no', 'sr.no', 'sl.no', 's/n', 'time', 'payment', 'mode'
      ];

      const medicalKeywords = [
        'hospital', 'clinic', 'medical', 'pharmacy', 'diagnostic', 'laboratory',
        'lab', 'health', 'care', 'wellness', 'doctor', 'dr.', 'physician',
        'surgeon', 'dental', 'dental', 'ayurveda', 'homeopathy', 'unani'
      ];

      const businessKeywords = [
        'pvt', 'ltd', 'limited', 'inc', 'corporation', 'corp', 'company',
        'enterprises', 'traders', 'solutions', 'services'
      ];

      let storeName = "Unknown Store";
      let storeType = '';
      let bestScore = 0;

      // Analyze top 15 lines (usually contains business name)
      for (let i = 0; i < Math.min(lines.length, 15); i++) {
        const rawLine = lines[i].text.trim();
        const lowerLine = rawLine.toLowerCase();

        // Skip if too short or only numbers/symbols
        if (rawLine.length < 3) continue;
        if (/^[\d\s.,\/\-:]+$/.test(rawLine)) continue;

        // Skip common header/footer patterns
        if (/^(invoice|bill|receipt|tax|gst|date|time)/i.test(rawLine)) continue;
        if (/^(total|amount|subtotal|grand)/i.test(rawLine)) continue;
        if (/^[A-Z\s]{1,3}$/.test(rawLine)) continue; // Skip single letters/initials

        // Check for ignore words
        const hasIgnoreWord = ignoreWords.some(w => 
          lowerLine === w || 
          lowerLine.startsWith(w + ' ') || 
          lowerLine.endsWith(' ' + w) ||
          lowerLine.includes(' ' + w + ' ')
        );

        if (hasIgnoreWord) continue;

        // Score the line based on various factors
        let score = 0;
        let detectedType = '';

        // Medical/Hospital detection
        const hasMedical = medicalKeywords.some(kw => lowerLine.includes(kw));
        if (hasMedical) {
          score += 50;
          detectedType = 'Medical';
          // Medical names are usually longer and more descriptive
          if (rawLine.length > 8 && rawLine.length < 60) score += 20;
        }

        // Business entity detection
        const hasBusiness = businessKeywords.some(kw => lowerLine.includes(kw));
        if (hasBusiness) {
          score += 30;
          if (!detectedType) detectedType = 'Business';
        }

        // Position bonus (top lines are more likely to be business names)
        if (i < 5) score += 20;
        if (i < 3) score += 10;

        // Length bonus (business names are usually 5-50 characters)
        if (rawLine.length >= 5 && rawLine.length <= 50) score += 15;
        if (rawLine.length >= 10 && rawLine.length <= 40) score += 10;

        // Capitalization bonus (business names often have proper capitalization)
        const hasProperCase = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*/.test(rawLine);
        if (hasProperCase) score += 10;

        // Avoid lines that look like addresses (contain common address words)
        const addressWords = ['street', 'road', 'lane', 'avenue', 'colony', 'nagar', 'society'];
        const hasAddress = addressWords.some(w => lowerLine.includes(w));
        if (hasAddress && score < 40) continue; // Skip if not high confidence

        // If this line scores higher, use it
        if (score > bestScore) {
          bestScore = score;
          storeName = rawLine;
          storeType = detectedType;
        }

        // Early exit if we found a high-confidence match
        if (score >= 60) break;
      }

      // Format store name
      if (storeName !== "Unknown Store") {
        // Clean up common OCR errors
        storeName = storeName
          .replace(/\s+/g, ' ') // Multiple spaces to single
          .replace(/^[^\w]+|[^\w]+$/g, '') // Remove leading/trailing non-word chars
          .trim();
      }

      // Format amount with source info
      let amountDisplay = "Not found";
      if (bestAmount > 0) {
        amountDisplay = bestAmount.toLocaleString('en-IN', { 
          style: 'currency', 
          currency: 'INR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        if (amountSource) {
          amountDisplay += ` (${amountSource})`;
        }
      }

      // Build result
      data.fields['Store/Medical Name'] = storeName;
      if (storeType) {
        data.fields['Type'] = storeType;
      }
      data.fields['Bill Amount'] = amountDisplay;
      
      // Additional info if available
      if (allAmounts.length > 0) {
        const uniqueAmounts = [...new Set(allAmounts.map(a => a.value))].sort((a, b) => b - a);
        if (uniqueAmounts.length > 1) {
          data.fields['Other Amounts Found'] = uniqueAmounts.slice(0, 3).map(a => 
            a.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
          ).join(', ');
        }
      }

      data.success = bestAmount > 0 || storeName !== "Unknown Store";

    }

    return data;

  };

  const getTabColor = (tab) => {

    switch(tab) {

      case 'aadhaar': return 'bg-blue-600';

      case 'pan': return 'bg-orange-600';

      case 'bill': return 'bg-green-600';

      default: return 'bg-gray-600';

    }

  };

  return (

    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">

      {/* Header */}

      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">

        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">

          <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">

            <RefreshCw className="w-6 h-6 text-indigo-600" />

            ScanAI <span className="text-xs font-normal text-slate-400">Pro</span>

          </h1>

          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">

            {tesseractLoaded ? "Engine Ready" : "Loading..."}

          </div>

        </div>

      </div>

      <div className="max-w-md mx-auto p-4 pb-20 space-y-6">

        

        {/* Document Type Selector */}

        <div className="grid grid-cols-3 gap-2 bg-slate-200 p-1 rounded-xl">

          <button 

            onClick={() => { setActiveTab('aadhaar'); setResult(null); setJsonResult(null); }}

            className={`py-2 px-1 text-sm font-medium rounded-lg flex flex-col items-center gap-1 transition-all ${activeTab === 'aadhaar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}

          >

            <CreditCard className="w-4 h-4" /> Aadhaar

          </button>

          <button 

            onClick={() => { setActiveTab('pan'); setResult(null); setJsonResult(null); }}

            className={`py-2 px-1 text-sm font-medium rounded-lg flex flex-col items-center gap-1 transition-all ${activeTab === 'pan' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}

          >

            <FileText className="w-4 h-4" /> PAN Card

          </button>

          <button 

            onClick={() => { setActiveTab('bill'); setResult(null); setJsonResult(null); }}

            className={`py-2 px-1 text-sm font-medium rounded-lg flex flex-col items-center gap-1 transition-all ${activeTab === 'bill' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}

          >

            <ShoppingBag className="w-4 h-4" /> Bill

          </button>

        </div>

        {/* Instructions */}

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">

          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />

          <p>

            {activeTab === 'aadhaar' && "Upload Aadhaar. Scans for 12-digit UID (XXXX XXXX XXXX)."}

            {activeTab === 'pan' && "Upload PAN. Advanced mode: Uses Whitelist & Fuzzy Regex matching."}

            {activeTab === 'bill' && "Upload Receipt/Bill. Advanced detection: Medical/Hospital names, Store names, and Bill amounts with multiple strategies."}

          </p>

        </div>

        {/* Upload Area */}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {!image ? (

            <div 

              onClick={() => fileInputRef.current?.click()}

              className="h-64 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer border-b border-slate-100"

            >

              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${activeTab === 'aadhaar' ? 'bg-blue-100 text-blue-600' : activeTab === 'pan' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>

                <Camera className="w-8 h-8" />

              </div>

              <span className="font-semibold text-slate-700">Tap to Scan / Upload</span>

              <span className="text-sm text-slate-400 mt-1">Supports JPG, PNG</span>

            </div>

          ) : (

            <div className="relative bg-slate-900">

              <img 

                src={processedImage || image} 

                alt="Preview" 

                className={`w-full h-auto max-h-[400px] object-contain ${processedImage ? 'grayscale contrast-125' : ''}`} 

              />

              <button 

                onClick={clearImage}

                className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-slate-700 hover:text-red-600 shadow-lg z-10"

              >

                <X className="w-5 h-5" />

              </button>

              {processedImage && (

                 <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">

                   <Wand2 className="w-3 h-3" /> Enhanced for OCR

                 </div>

              )}

            </div>

          )}

          

          <input 

            type="file" 

            ref={fileInputRef} 

            onChange={handleFileChange} 

            accept="image/*" 

            capture="environment" 

            className="hidden" 

          />

          {image && !processing && !result && (

            <div className="p-4">

              <button 

                onClick={processImage}

                disabled={!tesseractLoaded}

                className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${getTabColor(activeTab)} ${!tesseractLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}

              >

                Scan & Extract

              </button>

            </div>

          )}

          {/* Processing State */}

          {processing && (

            <div className="p-8 flex flex-col items-center justify-center">

              <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">

                <div 

                  className={`h-full transition-all duration-300 ${getTabColor(activeTab)}`}

                  style={{ width: `${progress}%` }}

                ></div>

              </div>

              <p className="text-slate-500 font-medium animate-pulse text-sm">

                {progress < 15 ? "Optimizing image..." : "Reading text..."} {progress}%

              </p>

            </div>

          )}

        </div>

        {/* Error Message */}

        {error && (

          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm flex items-start gap-2">

            <AlertCircle className="w-5 h-5 shrink-0" />

            {error}

          </div>

        )}

        {/* Results Card */}

        {result && (

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">

              <h3 className="font-bold flex items-center gap-2">

                <Check className="w-5 h-5 text-green-400" /> 

                {activeTab === 'pan' && jsonResult?.best_pan?.text ? "PAN Identified" : "Scan Complete"}

              </h3>

              {jsonResult && (

                <button 

                   onClick={() => setShowJson(!showJson)}

                   className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded flex items-center gap-1 transition"

                >

                   <Code className="w-3 h-3" /> {showJson ? "Hide JSON" : "Show JSON"}

                </button>

              )}

            </div>

            

            <div className="p-5 space-y-4">

              {/* Verdict Banner for PAN */}

              {activeTab === 'pan' && result.isHighConf !== undefined && (

                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-semibold ${result.isHighConf ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>

                  {result.isHighConf ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}

                  {result.isHighConf ? "High Confidence - Verified" : "Low Confidence - Check Manually"}

                </div>

              )}

              {Object.entries(result.fields).map(([key, value]) => {

                if (key === 'Verdict') return null; // Already shown above

                return (

                  <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">

                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1">{key}</span>

                    <span className="text-lg font-mono font-bold text-slate-800 break-all">{value}</span>

                  </div>

                );

              })}

              {/* Show cropped image for PAN if available */}

              {jsonResult?.cropped_images_base64?.[0] && (

                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center">

                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2 w-full">Detected ID Region</span>

                    <img src={jsonResult.cropped_images_base64[0]} alt="Cropped PAN" className="h-16 object-contain border border-slate-200 bg-white" />

                 </div>

              )}

              

              {showJson && jsonResult && (

                  <div className="mt-2 p-3 bg-slate-900 rounded-lg text-slate-300 font-mono text-[10px] overflow-auto max-h-64 whitespace-pre">

                      {JSON.stringify(jsonResult, null, 2)}

                  </div>

              )}

              <button 

                onClick={clearImage}

                className="w-full py-3 mt-2 border-2 border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition"

              >

                Scan Another

              </button>

            </div>

          </div>

        )}

      </div>

    </div>

  );

}

