"use client"

import { useState } from "react"
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Code,
  BookOpen,
  Target
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SubmissionAnalysisProps {
  analysis: {
    overallStatus: 'correct' | 'partial' | 'incorrect';
    score: number;
    totalPoints: number;
    summary: string;
    recommendations: string[];
    learningPoints: string[];
    errorAnalyses: Array<{
      errorType: string;
      errorMessage: string;
      errorLocation?: {
        line: number;
        column?: number;
        codeSnippet?: string;
      };
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }>;
    codeSuggestions: Array<{
      line: number;
      currentCode: string;
      suggestedCode: string;
      explanation: string;
      confidence: number;
    }>;
    testCaseAnalyses: Array<{
      testCaseIndex: number;
      passed: boolean;
      input: string;
      expectedOutput: string;
      actualOutput: string;
      errorMessage?: string;
      analysis: string;
      hints?: string[];
    }>;
  };
}

export function SubmissionAnalysis({ analysis }: SubmissionAnalysisProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [selectedTestCase, setSelectedTestCase] = useState<number | null>(null);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getStatusIcon = () => {
    switch (analysis.overallStatus) {
      case 'correct':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'incorrect':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (analysis.overallStatus) {
      case 'correct':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'partial':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'incorrect':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getErrorTypeLabel = (errorType: string) => {
    const labels: Record<string, string> = {
      syntax: 'Lỗi cú pháp',
      logic: 'Lỗi logic',
      runtime: 'Lỗi runtime',
      performance: 'Vấn đề hiệu năng',
      timeout: 'Quá thời gian',
      memory: 'Quá bộ nhớ',
      other: 'Lỗi khác'
    };
    return labels[errorType] || errorType;
  };

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-start gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">
                {analysis.overallStatus === 'correct' ? 'Hoàn thành!' : 
                 analysis.overallStatus === 'partial' ? 'Một phần đúng' : 'Chưa đúng'}
              </h3>
              <Badge variant="outline" className={getStatusColor()}>
                {analysis.score}/{analysis.totalPoints} test cases
              </Badge>
            </div>
            <p className="text-sm opacity-90">{analysis.summary}</p>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <Section
        title="Tóm tắt"
        icon={<Info className="w-4 h-4" />}
        expanded={expandedSections.has('summary')}
        onToggle={() => toggleSection('summary')}
      >
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">
              Điểm: {analysis.score}/{analysis.totalPoints}
            </Badge>
            <Badge variant="outline">
              Tỷ lệ: {((analysis.score / analysis.totalPoints) * 100).toFixed(0)}%
            </Badge>
          </div>
        </div>
      </Section>

      {/* Error Analyses */}
      {analysis.errorAnalyses.length > 0 && (
        <Section
          title="Phân tích lỗi"
          icon={<AlertTriangle className="w-4 h-4" />}
          expanded={expandedSections.has('errors')}
          onToggle={() => toggleSection('errors')}
        >
          <div className="space-y-3">
            {analysis.errorAnalyses.map((error, idx) => (
              <div key={idx} className="p-3 rounded border border-border bg-card">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getSeverityColor(error.severity)}>
                    {getErrorTypeLabel(error.errorType)}
                  </Badge>
                  <Badge variant="outline" className={getSeverityColor(error.severity)}>
                    {error.severity}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{error.errorMessage}</p>
                <p className="text-sm text-muted-foreground mb-2">{error.description}</p>
                {error.errorLocation && (
                  <div className="mt-2 p-2 bg-input rounded text-xs font-mono">
                    <div className="text-muted-foreground mb-1">Dòng {error.errorLocation.line}:</div>
                    <div className="text-foreground">{error.errorLocation.codeSnippet}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Test Case Analyses */}
      {analysis.testCaseAnalyses.length > 0 && (
        <Section
          title="Phân tích test cases"
          icon={<Target className="w-4 h-4" />}
          expanded={expandedSections.has('testcases')}
          onToggle={() => toggleSection('testcases')}
        >
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {analysis.testCaseAnalyses.map((tc, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTestCase(selectedTestCase === idx ? null : idx)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    selectedTestCase === idx
                      ? 'bg-primary/20 border border-primary text-primary'
                      : tc.passed
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                        : 'bg-red-500/20 border border-red-500/50 text-red-400'
                  }`}
                >
                  Test {tc.testCaseIndex + 1}
                  {tc.passed ? (
                    <CheckCircle2 className="w-3 h-3 inline ml-1" />
                  ) : (
                    <XCircle className="w-3 h-3 inline ml-1" />
                  )}
                </button>
              ))}
            </div>

            {selectedTestCase !== null && (
              <div className="mt-4 p-4 rounded border border-border bg-card">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Input:</p>
                    <div className="p-2 bg-input rounded font-mono text-sm">
                      {analysis.testCaseAnalyses[selectedTestCase].input}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Expected Output:</p>
                    <div className="p-2 bg-input rounded font-mono text-sm text-green-400">
                      {analysis.testCaseAnalyses[selectedTestCase].expectedOutput}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Actual Output:</p>
                    <div className={`p-2 bg-input rounded font-mono text-sm ${
                      analysis.testCaseAnalyses[selectedTestCase].passed ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {analysis.testCaseAnalyses[selectedTestCase].actualOutput}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Phân tích:</p>
                    <p className="text-sm text-foreground">
                      {analysis.testCaseAnalyses[selectedTestCase].analysis}
                    </p>
                  </div>
                  {analysis.testCaseAnalyses[selectedTestCase].hints && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Gợi ý:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                        {analysis.testCaseAnalyses[selectedTestCase].hints!.map((hint, i) => (
                          <li key={i}>{hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Code Suggestions */}
      {analysis.codeSuggestions.length > 0 && (
        <Section
          title="Gợi ý sửa code"
          icon={<Code className="w-4 h-4" />}
          expanded={expandedSections.has('suggestions')}
          onToggle={() => toggleSection('suggestions')}
        >
          <div className="space-y-3">
            {analysis.codeSuggestions.map((suggestion, idx) => (
              <div key={idx} className="p-3 rounded border border-border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Dòng {suggestion.line}</span>
                  <Badge variant="outline">
                    Độ tin cậy: {(suggestion.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Code hiện tại:</p>
                    <div className="p-2 bg-input rounded font-mono text-sm text-red-400">
                      {suggestion.currentCode}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Gợi ý:</p>
                    <div className="p-2 bg-input rounded font-mono text-sm text-green-400">
                      {suggestion.suggestedCode}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Section
          title="Khuyến nghị"
          icon={<Lightbulb className="w-4 h-4" />}
          expanded={expandedSections.has('recommendations')}
          onToggle={() => toggleSection('recommendations')}
        >
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Learning Points */}
      {analysis.learningPoints.length > 0 && (
        <Section
          title="Điểm học tập"
          icon={<BookOpen className="w-4 h-4" />}
          expanded={expandedSections.has('learning')}
          onToggle={() => toggleSection('learning')}
        >
          <ul className="space-y-2">
            {analysis.learningPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <BookOpen className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, icon, expanded, onToggle, children }: SectionProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-card hover:bg-card/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-foreground">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="p-4 border-t border-border bg-background">
          {children}
        </div>
      )}
    </div>
  );
}