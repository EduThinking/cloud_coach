/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud as CloudIcon, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  MessageCircle, 
  RefreshCcw,
  ArrowRight,
  Sparkles,
  Download,
  PartyPopper,
  FileDown,
  FileImage
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { GoogleGenAI } from "@google/genai";
import { TOCCloudData, Step } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const INITIAL_DATA: TOCCloudData = {
  parties: '',
  wantD: '',
  wantDPrime: '',
  needB: '',
  needC: '',
  objectiveA: '',
  assumptionsBD: [],
  assumptionsCDPrime: [],
  solutionsDPrimeB: [],
  solutionsDC: [],
};

const STEPS: { id: Step; label: string }[] = [
  { id: 'intro', label: '시작' },
  { id: 'step0', label: '갈등 당사자 파악' },
  { id: 'step1', label: '주장(Want) 입력' },
  { id: 'step2', label: '필요(Need) 분석' },
  { id: 'step3', label: '공통목표 설정' },
  { id: 'review', label: '논리 점검' },
  { id: 'step4', label: '숨겨진 가정 찾기' },
  { id: 'step5', label: '윈윈해결책 설계' },
  { id: 'final', label: '완성' },
];

export default function App() {
  const [step, setStep] = useState<Step>('intro');
  const [data, setData] = useState<TOCCloudData>(INITIAL_DATA);
  const [tempAssumption, setTempAssumption] = useState('');

  const currentStepIndex = STEPS.findIndex(s => s.id === step);
  const [isChecking, setIsChecking] = useState(false);
  const [coachingMessage, setCoachingMessage] = useState<string | null>(null);
  const [showCoaching, setShowCoaching] = useState(false);

  const handleStep1Validation = async () => {
    if (!data.wantD || !data.wantDPrime) return;
    
    setIsChecking(true);
    try {
      const prompt = `TOC(Theory of Constraints) 구름 생각도구 코치로서 사용자가 입력한 내용을 점검해주세요.
갈등하는 양측의 주장(Want)인 D와 D'가 대립되는(서로 반대되거나 양립할 수 없는) 표현이어야 합니다.

입력된 내용:
D: "${data.wantD}"
D': "${data.wantDPrime}"

1. 두 표현이 충분히 대립적인가요?
2. 만약 그렇다면 "OK"라고만 답변해주세요.
3. 만약 대립되지 않거나 관계가 모호하다면, 사용자에게 부드럽고 친절한 코칭 멘트를 한국어로 작성해주세요. 
   - 왜 대립관계로 보기 어려운지 설명해주세요.
   - 어떻게 수정하면 좋을지 예시 질문을 던져주세요.
   - 멘트는 짧고 명확하게(3~4문장 이내) 작성해주세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const result = response.text?.trim() || "";
      if (result.toUpperCase().includes("OK") && result.length < 10) {
        setStep('step2');
      } else {
        setCoachingMessage(result);
        setShowCoaching(true);
      }
    } catch (err) {
      console.error("Coaching Error:", err);
      setStep('step2');
    } finally {
      setIsChecking(false);
    }
  };

  const handleStep2Validation = async () => {
    if (!data.needB || !data.needC || !data.wantD || !data.wantDPrime) return;
    
    setIsChecking(true);
    try {
      const prompt = `TOC(Theory of Constraints) 구름 생각도구 코치로서 사용자가 입력한 내용을 점검해주세요.
필요(Need)와 주장(Want) 사이의 논리적 인과관계를 확인해야 합니다.

검증 항목:
1. "${data.needB}"(B 필요)를 충족하기 위해서는 반드시 "${data.wantD}"(D 주장)를 해야만 하는가?
2. "${data.needC}"(C 필요)를 충족하기 위해서는 반드시 "${data.wantDPrime}"(D' 주장)를 해야만 하는가?
3. "${data.wantD}"(D 주장)를 하면 "${data.needC}"(C 필요)를 달성하기 어려운가? (교차 충돌)
4. "${data.wantDPrime}"(D' 주장)를 하면 "${data.needB}"(B 필요)를 달성하기 어려운가? (교차 충돌)

입력된 내용:
B 필요: "${data.needB}"
C 필요: "${data.needC}"
D 주장: "${data.wantD}"
D' 주장: "${data.wantDPrime}"

코칭 지침:
- 논리가 맞다면 "OK"라고만 답변해주세요.
- 논리가 어색하거나 인과관계가 부족하다면 친절한 코칭 멘트를 한국어로 작성해주세요.
- "~하기 위해서는 ~해야만 한다"는 관계와, 대각선 방향의 "교차 충돌" 관계가 성립하는지 중점적으로 봐주세요.
- 멘트는 짧고 명확하게(3~4문장 이내) 작성해주세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const result = response.text?.trim() || "";
      if (result.toUpperCase().includes("OK") && result.length < 10) {
        setStep('step3');
      } else {
        setCoachingMessage(result);
        setShowCoaching(true);
      }
    } catch (err) {
      console.error("Coaching Error:", err);
      setStep('step3');
    } finally {
      setIsChecking(false);
    }
  };

  const handleStep3Validation = async () => {
    if (!data.objectiveA || !data.needB || !data.needC) return;
    
    setIsChecking(true);
    try {
      const prompt = `TOC(Theory of Constraints) 구름 생각도구 코치로서 사용자가 입력한 내용을 점검해주세요.
공통 목표(Common Objective, A)의 적절성을 확인해야 합니다.

검증 항목:
1. "공통 목표"가 양쪽의 필요(B와 C)를 모두 아우르고, 이들이 만족된 상위의 상태인가?
2. 논리 읽기: "A하기 위해서는 B해야만 한다"와 "A하기 위해서는 C해야만 한다"라고 읽었을 때 자연스러운가?
3. "공통 목표"가 단순히 양쪽의 필요 문장을 물리적으로 결합(조합)하여 작성되지는 않았는가?
4. 공통 목표가 한쪽의 필요(B 또는 C)에 너무 편향되어 있지는 않은가?

입력된 내용:
공통 목표(A): "${data.objectiveA}"
B 필요: "${data.needB}"
C 필요: "${data.needC}"

코칭 지침:
- 목표가 적절하다면 "OK"라고만 답변해주세요.
- 문제가 있다면 사용자에게 부드럽고 친절한 코칭 멘트를 한국어로 작성해주세요.
- 특히 "A를 위해 왜 B/C가 필수적인지"를 점검하도록 유도해주세요.
- 멘트는 짧고 명확하게(3~4문장 이내) 작성해주세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const result = response.text?.trim() || "";
      if (result.toUpperCase().includes("OK") && result.length < 10) {
        setStep('review');
      } else {
        setCoachingMessage(result);
        setShowCoaching(true);
      }
    } catch (err) {
      console.error("Coaching Error:", err);
      setStep('review');
    } finally {
      setIsChecking(false);
    }
  };

  const handleStep4Validation = async () => {
    if (data.assumptionsBD.length === 0 && data.assumptionsCDPrime.length === 0) {
      setStep('step5');
      return;
    }
    
    setIsChecking(true);
    try {
      const prompt = `TOC(Theory of Constraints) 구름 생각도구 코치로서 사용자가 입력한 '가정(Assumption)'을 점검해주세요.
가정은 "필요(Need)를 위해 왜 그 주장(Want)을 해야만 하는가?"에 대한 근거이자 이유입니다.

검증 항목:
1. B-D 가정: "${data.needB}"를 위해 왜 "${data.wantD}"를 해야 하는지에 대한 타당한 이유인가?
   (입력된 B-D 가정: ${data.assumptionsBD.join(', ')})
2. C-D' 가정: "${data.needC}"를 위해 왜 "${data.wantDPrime}"를 해야 하는지에 대한 타당한 이유인가?
   (입력된 C-D' 가정: ${data.assumptionsCDPrime.join(', ')})

코칭 지침:
- 작성된 가정들이 논리적 연결고리를 잘 설명한다면 "OK"라고만 답변해주세요.
- 가정이 너무 추상적이거나 인과관계와 상관없는 내용이라면 부드럽고 친절한 코칭 멘트를 한국어로 작성해주세요.
- 가정이 '해결의 실마리'가 될 수 있도록 구체적인 생각을 끌어내주세요.
- 멘트는 짧고 명확하게(3~4문장 이내) 작성해주세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const result = response.text?.trim() || "";
      if (result.toUpperCase().includes("OK") && result.length < 10) {
        setStep('step5');
      } else {
        setCoachingMessage(result);
        setShowCoaching(true);
      }
    } catch (err) {
      console.error("Coaching Error:", err);
      setStep('step5');
    } finally {
      setIsChecking(false);
    }
  };

  const nextStep = () => {
    if (step === 'step1') {
      handleStep1Validation();
      return;
    }
    if (step === 'step2') {
      handleStep2Validation();
      return;
    }
    if (step === 'step3') {
      handleStep3Validation();
      return;
    }
    if (step === 'step4') {
      handleStep4Validation();
      return;
    }
    if (currentStepIndex < STEPS.length - 1) {
      setStep(STEPS[currentStepIndex + 1].id);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setStep(STEPS[currentStepIndex - 1].id);
      window.scrollTo(0, 0);
    }
  };

  const resetData = () => {
    setData({
      parties: '',
      wantD: '',
      wantDPrime: '',
      needB: '',
      needC: '',
      objectiveA: '',
      assumptionsBD: [],
      assumptionsCDPrime: [],
      solutionsDPrimeB: [],
      solutionsDC: [],
    });
    setStep('intro');
    setCoachingMessage(null);
    setShowCoaching(false);
    setTempAssumption('');
    window.scrollTo(0, 0);
  };

  const updateData = (fields: Partial<TOCCloudData>) => {
    setData(prev => ({ ...prev, ...fields }));
  };

  const infographicRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleFinish = () => {
    if (data.solutionsDPrimeB.length === 0 && data.solutionsDC.length === 0) {
      alert('최소 한 개의 해결책을 입력해주세요.');
      return;
    }
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    setStep('final');
  };

  const downloadImage = async () => {
    if (!infographicRef.current) return;
    setIsDownloading(true);
    
    try {
      await document.fonts.ready;
      const originalScrollY = window.scrollY;
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const element = infographicRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('.final-cloud-grid') as HTMLElement;
          if (el) {
            el.style.transform = 'none';
            el.style.margin = '0 auto';
          }
          const container = clonedDoc.getElementById('infographic-container') as HTMLElement;
          if (container) {
            container.style.backgroundColor = '#ffffff';
            container.style.borderRadius = '0';
          }

          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            let css = styleTags[i].innerHTML;
            if (css.includes('oklab') || css.includes('oklch') || css.includes('color-mix')) {
              css = css.replace(/oklab\([^)]+\)/g, '#2563eb'); 
              css = css.replace(/oklch\([^)]+\)/g, '#2563eb');
              css = css.replace(/color-mix\([^)]+\)/g, '#2563eb');
              styleTags[i].innerHTML = css;
            }
          }

          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const node = allElements[i] as HTMLElement;
            if (node.style) {
              node.style.fontFamily = '"Pretendard", -apple-system, sans-serif';
              node.style.letterSpacing = 'normal';
              node.style.fontVariantLigatures = 'none';
              (node.style as any).fontKerning = 'none';
              (node.style as any).webkitFontSmoothing = 'antialiased';
              
              if (node.classList.contains('node-content')) {
                 node.style.overflow = 'visible';
                 node.style.wordBreak = 'keep-all';
                 node.style.whiteSpace = 'normal';
                 node.style.textOverflow = 'clip';
              }

              if (node.tagName === 'SPAN' || node.tagName === 'P' || node.tagName === 'LI' || node.tagName === 'DIV') {
                node.style.opacity = '1';
              }

              if (node.style.backgroundColor?.includes('oklab') || node.style.backgroundColor?.includes('color-mix')) {
                node.style.backgroundColor = '#ffffff';
              }
              if (node.style.color?.includes('oklab') || node.style.color?.includes('color-mix')) {
                node.style.color = '#1e293b';
              }
              if (node.style.borderColor?.includes('oklab') || node.style.borderColor?.includes('color-mix')) {
                node.style.borderColor = '#e2e8f0';
              }
              
              if (node.classList.contains('assumption-display-box')) {
                node.style.backgroundColor = '#2563eb';
                node.querySelectorAll('li').forEach(li => (li as HTMLElement).style.color = '#ffffff');
              }
              if (node.classList.contains('solution-display-box')) {
                node.style.backgroundColor = '#f59e0b';
                node.querySelectorAll('li').forEach(li => (li as HTMLElement).style.color = '#ffffff');
              }
            }
          }
        }
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      const imgData = canvas.toDataURL('image/png', 1.0);
      window.scrollTo(0, originalScrollY);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `구름_생각도구_${data.parties || '결과'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Image generation error:', error);
      alert('이미지 생성 중 오류가 발생했습니다. 브라우저의 캡처 기능을 이용해 주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-bg-base overflow-hidden">
      {/* Coaching Modal */}
      <AnimatePresence>
        {showCoaching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-text-main/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden border border-border-base"
            >
              <div className="p-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center text-primary text-2xl shadow-inner">
                    ✨
                  </div>
                  <h3 className="text-2xl font-black text-text-main tracking-tight">TOC 코치의 조언</h3>
                </div>
                <div className="bg-bg-base/50 p-6 rounded-2xl border border-border-base min-h-[120px] flex items-center">
                  <p className="text-text-main leading-relaxed font-medium text-lg whitespace-pre-wrap">
                    {coachingMessage}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowCoaching(false)}
                  className="flex-1 py-4 px-6 rounded-2xl border border-border-base text-text-muted font-bold hover:bg-bg-base transition-all"
                >
                  수정하러 가기
                </button>
                <button 
                  onClick={() => {
                    const nextStepMap = {
                      'step1': 'step2',
                      'step2': 'step3',
                      'step3': 'review',
                      'review': 'step4',
                      'step4': 'step5'
                    };
                    setShowCoaching(false);
                    setStep((nextStepMap as any)[step] || step);
                  }}
                  className="flex-1 py-4 px-6 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  그대로 진행하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-16 px-6 bg-white border-b border-border-base flex items-center justify-between shrink-0 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-primary text-xl">
            ☁️
          </div>
          <span className="font-extrabold text-sm text-primary tracking-tight whitespace-nowrap">구름(Cloud) 생각도구 코치 </span>
        </div>
        
        <nav className="flex gap-1.5 items-center ml-4">
          {STEPS.filter(s => s.id !== 'intro' && s.id !== 'final').map((s, idx) => {
            const stepIdx = STEPS.findIndex(st => st.id === s.id);
            const isCompleted = stepIdx < currentStepIndex;
            const isActive = step === s.id;
            
            return (
              <div 
                key={s.id}
                className={`px-3 py-1.5 rounded-full text-[0.65rem] font-bold transition-all whitespace-nowrap ${
                  isActive ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 
                  isCompleted ? 'bg-primary-light text-primary' : 'bg-border-base text-text-muted'
                }`}
              >
                Step {idx}. {s.label}
              </div>
            );
          })}
        </nav>
      </header>

      {step === 'intro' ? (
        <main className="flex-1 overflow-auto flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-10 max-w-2xl px-12 py-16 bg-white rounded-3xl border border-border-base shadow-2xl relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
            
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-light text-primary mb-2 shadow-inner">
               <Sparkles size={32} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tight text-text-main leading-tight">
                갈등을 논리로 해소시키는<br />
                <span className="text-primary">구름 생각도구 코칭</span>
              </h2>
              <p className="text-lg text-text-muted font-medium">
                서로 다른 주장의 이면에 숨겨진 필요를 발견하고,<br />
                모두가 상생하는 '윈-윈' 해결책을 만들어보세요.
              </p>
            </div>

            <div className="flex flex-col gap-4 items-center">
              <button 
                onClick={nextStep}
                className="group relative bg-primary text-white px-12 py-5 rounded-2xl text-xl font-bold hover:scale-105 transition-all shadow-[0_10px_30px_-10px_rgba(37,99,235,0.4)] flex items-center gap-2"
              >
                코칭 시작하기 <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </button>
              {data.parties && (
                <button onClick={resetData} className="text-text-muted hover:text-primary text-sm font-semibold underline underline-offset-4">
                  정보 초기화하고 새로 시작
                </button>
              )}
            </div>
          </motion.div>
        </main>
      ) : (
        <main className="flex-1 flex overflow-hidden">
          {/* Sidebar / Coach Panel */}
          <aside className="w-[380px] bg-white border-r border-border-base flex flex-col shrink-0 overflow-hidden shadow-xl z-20">
            <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-3 font-extrabold text-text-main text-sm">
                <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-primary">💬</div>
                TOC 코치
              </div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-bg-base p-6 rounded-2xl text-[0.95rem] leading-relaxed relative border border-border-base shadow-inner">
                    <div className="absolute left-6 -top-2 w-4 h-4 bg-bg-base border-t border-l border-border-base rotate-45" />
                    <p className="font-bold text-text-main mb-2">Step {currentStepIndex - 1}. {STEPS[currentStepIndex].label}</p>
                    <p className="text-text-muted">{COACH_TIPS[step] || "다음을 입력해주세요."}</p>
                  </div>

                  <div className="space-y-6">
                    {step === 'step0' && (
                       <InputField 
                        label="누구와 누구 사이의 갈등인가요?"
                        placeholder="예: 부모님과 나"
                        value={data.parties}
                        onChange={(val) => updateData({ parties: val })}
                      />
                    )}
                    {step === 'step1' && (
                      <div className="space-y-4">
                        <InputField label="D의 주장" placeholder="예: 게임을 더 하고 싶다" value={data.wantD} onChange={(val) => updateData({ wantD: val })} />
                        <InputField label="D'의 주장" placeholder="예: 지금 자야 한다" value={data.wantDPrime} onChange={(val) => updateData({ wantDPrime: val })} />
                      </div>
                    )}
                    {step === 'step2' && (
                      <div className="space-y-4">
                        <InputField label="B의 필요 (D를 원하는 이유)" placeholder="예: 즐거움을 느낀다" value={data.needB} onChange={(val) => updateData({ needB: val })} />
                        <InputField label="C의 필요 (D'를 원하는 이유)" placeholder="예: 컨디션을 관리한다" value={data.needC} onChange={(val) => updateData({ needC: val })} />
                      </div>
                    )}
                    {step === 'step3' && (
                      <InputField label="A 공통 목표" placeholder="예: 건강하고 행복하게 산다" value={data.objectiveA} onChange={(val) => updateData({ objectiveA: val })} />
                    )}
                    {step === 'review' && (
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-4 text-[0.95rem] leading-relaxed text-text-main shadow-inner">
                        <p className="font-black text-primary mb-3 flex items-center gap-2">
                          <CheckCircle2 size={16} /> 논리 읽어보기
                        </p>
                        
                        <div className="space-y-5">
                          {(() => {
                            // 명사형(~기) 변환 로직
                            const formatToGi = (s: string) => {
                              if (!s) return '...';
                              return s.trim().replace(/\.$/, '').replace(/한다$/, '하기').replace(/된다$/, '되기').replace(/다$/, '기');
                            };

                            // 당위형(~해야) 변환 로직 (한국어 어미 처리 강화)
                            const formatToHaeYa = (s: string) => {
                              if (!s) return '...';
                              let text = s.trim().replace(/\.$/, '');
                              
                              if (text.endsWith('한다')) return text.replace(/한다$/, '해야');
                              if (text.endsWith('된다')) return text.replace(/된다$/, '되어야');
                              if (text.endsWith('않는다')) return text.replace(/않는다$/, '않아야');
                              
                              const lastChar = text.charAt(text.length - 1);
                              if (lastChar === '다') {
                                const stem = text.slice(0, -1);
                                if (stem.endsWith('하')) return stem.slice(0, -1) + '해야';
                                if (stem.endsWith('보호')) return stem + '해야';
                                if (stem.endsWith('줄인')) return stem.slice(0, -1) + '여야'; // 줄여야
                                if (stem.endsWith('만든')) return stem.slice(0, -1) + '어야'; // 만들어야
                                if (stem.endsWith('있')) return stem + '어야'; // 있어야
                                if (stem.endsWith('없')) return stem + '어야'; // 없어야
                                return stem + '어야';
                              }
                              return text + ' 해야';
                            };
                            
                            return (
                              <>
                                <div className="space-y-1">
                                  <p className="text-xs text-text-muted font-bold mb-1">상단 논리 (A-B-D):</p>
                                  <p className="bg-white/50 p-3 rounded-lg border border-primary/10">
                                    "<b>{formatToGi(data.objectiveA)}</b> 위해서는 <b>{formatToHaeYa(data.needB)}</b> 하며,<br/>
                                    그러기 위해서는 <b>{data.wantD}</b>(을)를 해야만 한다."
                                  </p>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-xs text-text-muted font-bold mb-1">하단 논리 (A-C-D'):</p>
                                  <p className="bg-white/50 p-3 rounded-lg border border-primary/10">
                                    "또한 <b>{formatToGi(data.objectiveA)}</b> 위해서는 <b>{formatToHaeYa(data.needC)}</b> 하며,<br/>
                                    그러기 위해서는 <b>{data.wantDPrime}</b>(을)를 해야만 한다."
                                  </p>
                                </div>
                              </>
                            );
                          })()}
                          
                          <div className="pt-3 border-t border-accent/10">
                            <p className="text-xs text-accent/60 font-bold mb-2">충돌 확인 (D vs D'):</p>
                            <p className="text-accent font-black bg-accent/5 p-3 rounded-lg border border-accent/10">
                              하지만 <b>{data.wantD}</b>와(과) <b>{data.wantDPrime}</b>은(는)<br/>동시에 일어날 수 없으므로 서로 대립됩니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {step === 'step4' && (
                      <div className="space-y-6">
                        <AssumptionInput 
                          label="B-D의 가정" 
                          items={data.assumptionsBD} 
                          onAdd={(val) => updateData({ assumptionsBD: [...data.assumptionsBD, val] })} 
                          onRemove={(i) => updateData({ assumptionsBD: data.assumptionsBD.filter((_, idx) => idx !== i) })}
                        />
                        <AssumptionInput 
                          label="C-D'의 가정" 
                          items={data.assumptionsCDPrime} 
                          onAdd={(val) => updateData({ assumptionsCDPrime: [...data.assumptionsCDPrime, val] })} 
                          onRemove={(i) => updateData({ assumptionsCDPrime: data.assumptionsCDPrime.filter((_, idx) => idx !== i) })}
                        />
                      </div>
                    )}
                    {step === 'step5' && (
                      <div className="space-y-6">
                        <SolutionInput 
                          label="D'하면서 B할 수 있는 윈윈해결책" 
                          placeholder="예: 평일에 끄는 대신 주말에 30분 더 한다" 
                          items={data.solutionsDPrimeB} 
                          onAdd={(val) => updateData({ solutionsDPrimeB: [...data.solutionsDPrimeB, val] })} 
                          onRemove={(i) => updateData({ solutionsDPrimeB: data.solutionsDPrimeB.filter((_, idx) => idx !== i) })}
                        />
                        <SolutionInput 
                          label="D하면서 C할 수 있는 윈윈해결책" 
                          placeholder="예: 독서등을 사용하여 방해하지 않는다" 
                          items={data.solutionsDC} 
                          onAdd={(val) => updateData({ solutionsDC: [...data.solutionsDC, val] })} 
                          onRemove={(i) => updateData({ solutionsDC: data.solutionsDC.filter((_, idx) => idx !== i) })}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="p-8 border-t border-border-base bg-bg-base/50 space-y-4">
              <div className="flex gap-2">
                <button onClick={prevStep} className="flex-1 py-4 rounded-xl border border-border-base font-bold text-text-muted hover:bg-white transition-all flex items-center justify-center gap-1">
                  <ChevronLeft size={18} /> 이전
                </button>
                {step === 'final' ? (
                  <button 
                    onClick={downloadImage} 
                    disabled={isDownloading}
                    className="flex-[2] py-4 rounded-xl bg-accent text-white font-black shadow-lg shadow-accent/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <RefreshCcw size={18} className="animate-spin" />
                    ) : (
                      <>이미지로 저장 <FileImage size={18} /></>
                    )}
                  </button>
                ) : step === 'step5' ? (
                  <button onClick={handleFinish} className="flex-[2] py-4 rounded-xl bg-accent text-white font-black shadow-lg shadow-accent/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                    구름 생각도구 완성 <PartyPopper size={20} />
                  </button>
                ) : (
                  <button 
                    onClick={nextStep} 
                    className="flex-[2] py-4 rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                    disabled={
                      (step === 'step0' && !data.parties) ||
                      (step === 'step1' && (!data.wantD || !data.wantDPrime)) ||
                      (step === 'step2' && (!data.needB || !data.needC)) ||
                      (step === 'step3' && !data.objectiveA) ||
                      isChecking
                    }
                  >
                    {isChecking ? (
                      <RefreshCcw size={18} className="animate-spin" />
                    ) : (
                      <>다음 단계로 <ChevronRight size={18} /></>
                    )}
                  </button>
                )}
              </div>
              <button onClick={resetData} className="w-full text-[0.65rem] font-bold text-text-muted/50 uppercase tracking-widest hover:text-text-muted">
                새 구름 만들기 (데이터 초기화)
              </button>
            </div>
          </aside>

          {/* Visualization Canvas */}
          <section className="flex-1 bg-bg-base p-10 flex flex-col items-center justify-center overflow-auto custom-scrollbar">
            {step === 'final' ? (
               <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-5xl w-full"
              >
                <div ref={infographicRef} id="infographic-container" className="bg-white p-16 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-border-base relative overflow-hidden">
                  <header className="mb-16 text-center">
                     <h2 className="text-3xl font-black text-text-main mb-2">구름(Cloud) 생각도구</h2>
                     <p className="text-text-muted font-medium">{data.parties} 사이의 갈등 해결 지도</p>
                  </header>
                  
                  <div className="final-cloud-grid mx-auto">
                    {/* SVG Arrows Overlay for Final Infographic */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
                      <defs>
                        <marker id="final-arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto-start-reverse">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                        </marker>
                      </defs>
                      {/* D -> B */}
                      <path d="M 560 280 L 485 280" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#final-arrowhead)" />
                      {/* D' -> C */}
                      <path d="M 560 460 L 485 460" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#final-arrowhead)" />
                      {/* B -> A */}
                      <path d="M 260 280 L 185 370" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#final-arrowhead)" />
                      {/* C -> A */}
                      <path d="M 260 460 L 185 370" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#final-arrowhead)" />
                      
                      {/* Double Headed Conflict Zigzag Z-Shape D <-> D' */}
                      <path 
                        d="M 655 350 L 655 390 L 685 350 L 685 390" 
                        stroke="#94a3b8" 
                        strokeWidth="2.5" 
                        fill="none"
                        markerStart="url(#final-arrowhead)"
                        markerEnd="url(#final-arrowhead)"
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>

                    {/* Parties Indicator */}
                    {data.parties && (() => {
                      const parties = data.parties.split(/[와과,&/]/).map(p => p.trim()).filter(p => p);
                      const [p1, p2] = parties.length >= 2 ? [parties[0], parties[1]] : [data.parties, ''];
                      return (
                        <div className="absolute left-[520px] top-[370px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-20 bg-white px-4 py-2 rounded-xl border border-border-base shadow-sm">
                          <span className="text-[0.7rem] font-black text-text-main leading-tight whitespace-nowrap">{p1}</span>
                          <div className="w-12 h-px bg-text-muted/50" />
                          <span className="text-[0.7rem] font-black text-text-main leading-tight whitespace-nowrap text-center">{p2}</span>
                        </div>
                      );
                    })()}

                    {/* Assumptions Top (B-D) */}
                    <div className="col-start-2 row-start-1 flex flex-col gap-2">
                      <div className="text-[0.6rem] font-black text-primary/40 uppercase text-center">B-D 가정</div>
                      <div className="assumption-display-box custom-scrollbar">
                        <ul className="list-none space-y-1">
                          {data.assumptionsBD.map((a, i) => <li key={i} className="text-[0.7rem] font-bold text-primary">• {a}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* Solutions Top (D' while B) */}
                    <div className="col-start-3 row-start-1 flex flex-col gap-2">
                       <div className="text-[0.6rem] font-black text-accent/40 uppercase text-center">D'하면서 B 해결책</div>
                       <div className="solution-display-box custom-scrollbar">
                        <ul className="list-none space-y-1">
                          {data.solutionsDPrimeB.map((s, i) => <li key={i} className="text-[0.7rem] font-black text-white italic">→ {s}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* Main Nodes */}
                    <div className="col-start-1 row-start-2 row-span-2 flex items-center justify-center">
                      <VisualNode id="A" label="공통 목표" content={data.objectiveA} />
                    </div>

                    <div className="col-start-2 row-start-2 flex items-center justify-center">
                      <VisualNode id="B" label="필요" content={data.needB} />
                    </div>
                    <div className="col-start-2 row-start-3 flex items-center justify-center">
                      <VisualNode id="C" label="필요" content={data.needC} />
                    </div>

                    <div className="col-start-3 row-start-2 flex items-center justify-center relative">
                      <VisualNode id="D" label="주장" content={data.wantD} />
                    </div>
                    <div className="col-start-3 row-start-3 flex items-center justify-center relative">
                      <VisualNode id="D'" label="주장" content={data.wantDPrime} />
                    </div>

                    {/* Assumptions Bottom (C-D') */}
                    <div className="col-start-2 row-start-4 flex flex-col gap-2 mt-2">
                      <div className="assumption-display-box custom-scrollbar">
                        <ul className="list-none space-y-1">
                          {data.assumptionsCDPrime.map((a, i) => <li key={i} className="text-[0.7rem] font-bold text-primary">• {a}</li>)}
                        </ul>
                      </div>
                      <div className="text-[0.6rem] font-black text-primary/40 uppercase text-center">C-D' 가정</div>
                    </div>

                    {/* Solutions Bottom (D while C) */}
                    <div className="col-start-3 row-start-4 flex flex-col gap-2 mt-2">
                      <div className="solution-display-box custom-scrollbar">
                        <ul className="list-none space-y-1">
                          {data.solutionsDC.map((s, i) => <li key={i} className="text-[0.7rem] font-black text-white italic">→ {s}</li>)}
                        </ul>
                      </div>
                      <div className="text-[0.6rem] font-black text-accent/40 uppercase text-center">D하면서 C 해결책</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 mt-10">
                    <button 
                      onClick={downloadImage} 
                      disabled={isDownloading}
                      className="bg-accent text-white px-8 py-3 rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <RefreshCcw size={16} className="animate-spin" />
                      ) : (
                        <FileImage size={16} />
                      )}
                      이미지로 저장하기
                    </button>
                   <button onClick={resetData} className="bg-white px-8 py-3 rounded-full border border-border-base text-text-muted font-bold hover:text-primary transition-all flex items-center gap-2">
                     <RefreshCcw size={16} /> 새로 시작하기
                   </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-12">
                <CloudVisualization data={data} activeStep={step} />
                
                {step === 'review' && (
                  <div className="bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-border-base max-w-xl text-center space-y-4">
                    <p className="text-xs font-black text-primary uppercase tracking-widest">Logic Self Check</p>
                    <p className="text-lg font-medium leading-relaxed italic text-text-main">
                      "{data.wantD || 'D'} 하려 할 때 {data.needC || 'C'} 필요가 위협받을 수 있으며,<br/>
                      {data.wantDPrime || "D'"} 하려 할 때 {data.needB || 'B'} 필요가 위협받을 수 있음을 확인하세요."
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}

function CloudVisualization({ data, activeStep }: { data: TOCCloudData; activeStep: Step }) {
  const parties = data.parties.split(/[와과,&/]/).map(p => p.trim()).filter(p => p);
  const [p1, p2] = parties.length >= 2 ? [parties[0], parties[1]] : [data.parties, ''];

  return (
    <div className="cloud-container mx-auto">
      {/* SVG Arrows Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto-start-reverse">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
        </defs>
        
        {/* D -> B */}
        <path d="M 520 60 L 465 60" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
        {/* D' -> C */}
        <path d="M 520 220 L 465 220" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
        
        {/* B -> A */}
        <path d="M 260 60 L 205 110" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        {/* C -> A */}
        <path d="M 260 220 L 205 170" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />

        {/* Double Headed Conflict Zigzag Z-Shape D <-> D' */}
        <path 
          d="M 610 115 L 610 165 L 635 115 L 635 165" 
          stroke="#94a3b8" 
          strokeWidth="2.5" 
          fill="none"
          markerStart="url(#arrowhead)"
          markerEnd="url(#arrowhead)"
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>

      {/* Parties Indicator */}
      {data.parties && (
        <div className="absolute left-[490px] top-[141px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-20 bg-bg-base/90 px-3 py-2 rounded-xl backdrop-blur-sm border border-border-base/50 shadow-sm">
          <span className="text-[0.65rem] font-black text-text-main leading-tight whitespace-nowrap">{p1}</span>
          <div className="w-10 h-px bg-text-muted/40" />
          <span className="text-[0.65rem] font-black text-text-main leading-tight whitespace-nowrap text-center">{p2}</span>
        </div>
      )}

      {/* Node A */}
      <div className="col-start-1 row-start-1 row-span-2 flex items-center justify-center">
        <VisualNode id="A" label="공통 목표" content={data.objectiveA} active={activeStep === 'step3'} />
      </div>

      {/* Node B & C */}
      <div className="col-start-2 row-start-1 flex flex-col items-center justify-center relative">
        {data.assumptionsBD.length > 0 && (
          <div className="absolute -top-24 w-full flex flex-col items-center gap-1.5 px-2 pointer-events-none">
            {data.assumptionsBD.map((asm, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-[0.6rem] font-bold text-primary shadow-sm whitespace-normal line-clamp-3 text-center w-[200px] leading-tight"
              >
                💡 {asm}
              </motion.div>
            ))}
          </div>
        )}
        <VisualNode id="B" label="필요" content={data.needB} active={activeStep === 'step2'} />
      </div>
      <div className="col-start-2 row-start-2 flex flex-col items-center justify-center relative">
        <VisualNode id="C" label="필요" content={data.needC} active={activeStep === 'step2'} />
        {data.assumptionsCDPrime.length > 0 && (
          <div className="absolute -bottom-24 w-full flex flex-col items-center gap-1.5 px-2 pointer-events-none">
            {data.assumptionsCDPrime.map((asm, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-[0.6rem] font-bold text-primary shadow-sm whitespace-normal line-clamp-3 text-center w-[200px] leading-tight"
              >
                💡 {asm}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Node D & D' */}
      <div className="col-start-3 row-start-1 flex items-center justify-center">
        <VisualNode id="D" label="주장" content={data.wantD} active={activeStep === 'step1'} />
      </div>
      <div className="col-start-3 row-start-2 flex items-center justify-center">
        <VisualNode id="D'" label="주장" content={data.wantDPrime} active={activeStep === 'step1'} />
      </div>

      {/* Conflict UI Label REMOVED */}
    </div>
  );
}

function VisualNode({ id, label, content, active }: { id: string; label: string; content: string; active?: boolean }) {
  return (
    <div className={`node-box w-full max-w-[200px] ${active ? 'active' : ''}`}>
      <span className="node-label">{id} {label}</span>
      <div className={`node-content ${!content ? 'placeholder' : ''}`}>
        {content || '작성 전'}
      </div>
    </div>
  );
}

function InputField({ label, placeholder, value, onChange, rows = 3 }: { 
  label: string; 
  placeholder: string; 
  value: string; 
  onChange: (val: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[0.65rem] font-black text-text-muted uppercase tracking-[0.2em]">{label}</label>
      <textarea 
        placeholder={placeholder}
        className="w-full p-4 rounded-xl border border-border-base bg-bg-base/30 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none text-[0.95rem] font-medium"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function AssumptionInput({ label, items, onAdd, onRemove }: { 
  label: string; 
  items: string[]; 
  onAdd: (val: string) => void; 
  onRemove: (idx: number) => void;
}) {
  const [val, setVal] = useState('');
  return (
    <div className="space-y-3">
      <label className="text-[0.65rem] font-black text-text-muted uppercase tracking-[0.2em]">{label}</label>
      
      {/* List first as requested */}
      <div className="flex flex-wrap gap-1 mb-2">
        {items.map((item, i) => (
          <span key={item + i} className="bg-primary/5 border border-primary/20 px-2.5 py-1 rounded-lg text-[0.7rem] font-bold text-primary flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 transition-all">
            {item}
            <button onClick={() => onRemove(i)} className="hover:text-red-500 font-bold ml-1">×</button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input 
          type="text"
          className="flex-1 p-3 rounded-xl border border-border-base bg-bg-base/30 outline-none focus:bg-white focus:border-primary transition-all text-sm"
          placeholder="가정 입력..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && val) {
              onAdd(val);
              setVal('');
            }
          }}
        />
        <button 
          onClick={() => { if(val) { onAdd(val); setVal(''); } }}
          className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shrink-0"
        >+</button>
      </div>
    </div>
  );
}

function SolutionInput({ label, placeholder, items, onAdd, onRemove }: { 
  label: string; 
  placeholder: string;
  items: string[]; 
  onAdd: (val: string) => void; 
  onRemove: (idx: number) => void;
}) {
  const [val, setVal] = useState('');
  return (
    <div className="space-y-3">
      <label className="text-[0.65rem] font-black text-text-muted uppercase tracking-[0.2em]">{label}</label>
      
      {/* List first as requested */}
      <div className="space-y-2 mb-2">
        {items.map((item, i) => (
          <div key={item + i} className="bg-accent/5 border border-accent/20 p-2.5 rounded-lg text-xs font-bold text-accent flex items-start justify-between gap-2 animate-in fade-in slide-in-from-right-2">
            <span className="break-words line-clamp-2 flex-1 leading-tight">{item}</span>
            <button onClick={() => onRemove(i)} className="text-accent/50 hover:text-red-500 font-bold shrink-0">×</button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <textarea 
          rows={2}
          className="flex-1 p-3 rounded-xl border border-border-base bg-bg-base/30 outline-none focus:bg-white focus:border-primary transition-all text-sm resize-none"
          placeholder={placeholder}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <button 
          onClick={() => { if(val) { onAdd(val); setVal(''); } }}
          className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center shrink-0 self-center"
        >+</button>
      </div>
    </div>
  );
}

const COACH_TIPS: Record<string, string> = {
  step0: "갈등은 감정이 아닌 현상입니다. 누구와 누구 사이의 갈등인지 적어보세요.",
  step1: "주장을 적을 때는 타협점을 찾으려 하지 말고, 지금 각자가 가장 강하게 내세우는 주장을 대립되는 표현으로 적어보세요.",
  step2: "B와 C는 주장을 통해 무엇을 얻고 싶은지 묻는 단계입니다. 평서문으로 간결하게 필요 그 자체를 적어주세요.",
  step3: "양측의 필요가 만족되면 어떤 상태가 되는 걸까요? '우리는 한 팀'이라는 마음으로 공통목표를 세워보세요.",
  review: "이 문장들을 소리 내어 읽어보면 논리의 틈이 보입니다. 어색하다면 문장을 수정해보세요.",
  step4: "가정은 '당연하다고 믿는 것'입니다. 그 믿음이 정말 사실인지 의심해보는 것이 해결의 시작입니다.",
  step5: "D 하면서 C 하거나, D' 하면서 B 할 수 없을까요? 창의적인 해결책은 고정관념에서 벗어날 때 나옵니다. 가정을 깨는 해결책을 찾아보세요.",
  final: "내가 작성한 구름 생각도구를 이미지로 저장하세요.",
};
