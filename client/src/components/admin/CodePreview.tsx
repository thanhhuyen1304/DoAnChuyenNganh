import React from 'react';
import Editor from '@monaco-editor/react';

interface CodePreviewProps {
  code: string;
  language: string;
  height?: string;
  readOnly?: boolean;
  onChange?: (value: string | undefined) => void;
}

export const CodePreview: React.FC<CodePreviewProps> = ({
  code,
  language,
  height = "300px",
  readOnly = true,
  onChange
}) => {
  // Ánh xạ ngôn ngữ cho monaco editor
  const getMonacoLanguage = (lang: string): string => {
    const languageMap: { [key: string]: string } = {
      'Python': 'python',
      'JavaScript': 'javascript',
      'TypeScript': 'typescript',
      'Java': 'java',
      'C++': 'cpp',
      'C': 'c',
      'C#': 'csharp',
    };
    return languageMap[lang] || 'plaintext';
  };

  return (
    <Editor
      height={height}
      defaultLanguage={getMonacoLanguage(language)}
      value={code}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        wordWrap: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
      }}
      onChange={onChange}
    />
  );
};