import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { BrochurePage } from '../../types';
import { 
  Upload, 
  Trash2, 
  Image as ImageIcon,
  FileText,
  HelpCircle
} from 'lucide-react';

interface BrochurePageEditorProps {
  projectId: string;
  pageNumber: number;
  pageData: BrochurePage['content'];
  onDataChange: (data: BrochurePage['content']) => void;
  isEditable?: boolean;
}

export function BrochurePageEditor({ 
  projectId, 
  pageNumber, 
  pageData, 
  onDataChange,
  isEditable = true
}: BrochurePageEditorProps) {
  const [localData, setLocalData] = useState<BrochurePage['content']>(pageData);
  // ReactQuill manages its own editor instance (no local ref needed)

  useEffect(() => {
    setLocalData(pageData);
  }, [pageData]);

  const handleInputChange = (field: string, value: any) => {
    if (!isEditable) return;
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onDataChange(newData);
  };

  // ReactQuill handles focus internally

  // Heuristic-based reversed word fixer for English-looking words
  const reverseString = (s: string) => s.split('').reverse().join('');
  const bigramSet = new Set([
    'th','he','in','er','an','re','on','at','en','nd','ti','es','or','te','of','ed','is','it','al','ar',
    'st','to','nt','ng','se','ha','as','ou','io','le','is','ve','co','me','de','hi','ri','ro','ic','ne',
    'll','el','lo','wh','sh','ch','pr','pl','tr','qu','re','com','con','pro','pre'
  ]);
  const scoreEnglishness = (word: string) => {
    let score = 0;
    const lower = word.toLowerCase();
    for (let i = 0; i < lower.length - 1; i++) {
      const bg = lower.substring(i, i + 2);
      if (bigramSet.has(bg)) score++;
    }
    return score;
  };
  const shouldReverseWord = (word: string) => {
    if (!/^[A-Za-z]{3,}$/.test(word)) return false;
    const rev = reverseString(word);
    return scoreEnglishness(rev) > scoreEnglishness(word);
  };
  const normalizeReversedWordsInText = (text: string) => {
    return text.replace(/[A-Za-z]{3,}/g, (w) => (shouldReverseWord(w) ? reverseString(w) : w));
  };
  const normalizeReversedWordsInHTML = (html: string) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }
    textNodes.forEach((tn) => {
      tn.nodeValue = normalizeReversedWordsInText(tn.nodeValue || '');
    });
    return container.innerHTML;
  };

  const handleFileUpload = (file: File) => {
    if (!isEditable) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    // In a real app, this would upload to a server
    const url = URL.createObjectURL(file);
    const images = (localData.images || []);
    handleInputChange('images', [...images, url]);
  };

  const removeImage = (index: number) => {
    if (!isEditable) return;
    const images = localData.images || [];
    const newImages = images.filter((_, i) => i !== index);
    handleInputChange('images', newImages);
  };

  const renderTooltip = (text: string) => (
    <div className="group relative inline-block ml-2">
      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {text}
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${!isEditable ? 'opacity-60 pointer-events-none' : ''}`} data-project-id={projectId}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-red-600" />
        Page {pageNumber}
        {!isEditable && <span className="ml-2 text-sm text-yellow-600">(🔒 Locked)</span>}
      </h3>

      <div className="space-y-6">
        {/* Text Content Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Text Content
            {renderTooltip('Use the toolbar to format: bold, italic, bullets')}
          </label>
          <ReactQuill
            theme="snow"
            value={(localData.body_content as string) || ''}
            onChange={(html) => {
              const normalized = normalizeReversedWordsInHTML(html);
              handleInputChange('body_content', normalized);
            }}
            readOnly={!isEditable}
            modules={{
              toolbar: [
                ['bold', 'italic'],
                [{ list: 'bullet' }],
                ['clean']
              ],
              clipboard: {
                matchVisual: false
              }
            }}
            formats={['bold', 'italic', 'list', 'bullet']}
            className="bg-white border border-gray-300 rounded-lg min-h-[160px]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supports bold, italic, and bullet lists. Select text and click toolbar.
          </p>
        </div>

        {/* Images Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <ImageIcon className="w-4 h-4 mr-2" />
            Images (Optional)
            {renderTooltip('Upload images to support your content (max 5MB each)')}
          </label>
          
          {/* Existing Images */}
          {(localData.images || []).length > 0 && (
            <div className="space-y-3 mb-4">
              {(localData.images || []).map((image, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <img src={image} alt={`Image ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Image {index + 1}</p>
                    <p className="text-xs text-gray-500">Click to view full size</p>
                  </div>
                  {isEditable && (
                    <button
                      onClick={() => removeImage(index)}
                      className="text-red-600 hover:text-red-800 transition-colors p-1"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Area */}
          {isEditable && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
              <label className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-1">Click to upload image</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </label>
            </div>
          )}

          {!isEditable && (localData.images || []).length === 0 && (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No images uploaded</p>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Page Guidelines:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Add your main content in the text area above</li>
            <li>• Images are optional but can help illustrate your content</li>
            <li>• Keep your content clear and concise</li>
            <li>• Changes are saved automatically while you edit</li>
          </ul>
        </div>
      </div>
    </div>
  );
}