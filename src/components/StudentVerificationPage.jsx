import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const progressSteps = ['Upload Document', 'Review Pending', 'Verification Complete'];

const infoBoxes = [
  {
    title: 'Accepted Documents',
    content: 'Please upload a clear, legible copy of your',
    details: 'University ID Card',
    details2: 'School Fees Receipt',
    note: 'Accepted formats: JPG, PNG, PDF. Maximum file size: 5MB.',
  },
  {
    title: 'Review Process',
    content: 'Our team will review your submission within 24-48 hours. You will receive an email notification once your account is verified.',
  },
];

const ProgressBar = ({ currentStep }) => {
  return (
    <div className="w-full max-w-2xl mx-auto mb-10">
      <div className="flex items-center">
        {progressSteps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= currentStep;
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center relative flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors duration-300 ${
                    isActive ? 'bg-clientPrimary text-white' : 'bg-border text-muted-foreground'
                  }`}
                >
                  {stepNumber}
                </div>
                <p
                  className={`text-xs sm:text-sm font-medium mt-2 text-center transition-colors duration-300 ${
                    isActive ? 'text-clientPrimary' : 'text-muted-foreground'
                  }`}
                >
                  {step}
                </p>
              </div>
              {index < progressSteps.length - 1 && <div className="flex-1 h-0.5 bg-border"></div>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const FileUpload = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div
      className={`flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-clientBackground px-6 py-14 transition-colors ${
        isDragging ? 'bg-clientPrimary/10' : 'bg-clientBackground'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-16 h-16 text-clientPrimary flex items-center justify-center rounded-full mb-2">
          <span className="material-symbols-outlined text-5xl">upload_file</span>
        </div>
        <p className="text-clientPrimary text-lg font-medium tracking-tight">
          Drag & drop your document here
        </p>
        <p className="text-muted-foreground text-sm font-normal">
          or{' '}
          <button
            type="button"
            onClick={handleBrowseClick}
            className="font-medium text-clientPrimary underline hover:text-opacity-80 focus:outline-none"
          >
            click to browse
          </button>
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
        />
      </div>
    </div>
  );
};

const StudentVerificationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      alert('Please select a document to submit.');
      return;
    }
    console.log('Submitting file:', selectedFile.name);
    navigate('/verification-pending');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-clientBackground dark:bg-client-background-dark">
      <div className="flex-grow px-4 sm:px-8 md:px-20 lg:px-40 flex justify-center py-5">
        <div className="flex flex-col w-full max-w-[768px] flex-1">
          <main className="flex flex-col flex-1 py-10 px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-3 p-4 mb-8">
              <h1 className="text-clientPrimary text-4xl font-bold tracking-tighter">
                UniConnect Student Verification
              </h1>
              <p className="text-muted-foreground text-base font-normal max-w-2xl">
                To complete your profile and access all features of UniConnect, please upload a document to verify your student status.
              </p>
            </div>

            <ProgressBar currentStep={currentStep} />

            <div className="flex flex-col p-4 border border-clientBackground rounded-lg">
              {currentStep === 1 && <FileUpload onFileSelect={handleFileSelect} />}
              {selectedFile && currentStep === 1 && (
                <div className="mt-4 text-center text-sm font-medium text-clientPrimary">
                  File selected: {selectedFile.name}
                </div>
              )}

              {currentStep > 1 && (
                <div className="text-center py-14">
                  <span className="material-symbols-outlined text-6xl text-clientPrimary animate-pulse">
                    {currentStep === 2 ? 'hourglass_top' : 'verified_user'}
                  </span>
                  <p className="mt-4 text-lg font-medium text-clientPrimary">
                    {currentStep === 2 ? 'Your document is under review.' : 'Verification Complete!'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {currentStep === 2 ? 'This may take 24-48 hours.' : 'Welcome to the full UniConnect experience.'}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-4 mt-6">
                {infoBoxes.map((box) => (
                  <div key={box.title} className="flex flex-col bg-clientPrimary/5 p-4 rounded-lg">
                    <p className="text-clientPrimary text-sm font-medium mb-2">{box.title}</p>
                    <p className="text-muted-foreground text-sm font-normal">
                      {box.content}
                      {box.details && <span className="font-medium text-clientPrimary"> {box.details}</span>}
                      {box.details2 && (
                        <>
                          {' '}
                          or your most recent <span className="font-medium text-clientPrimary">{box.details2}</span>.
                        </>
                      )}
                    </p>
                    {box.note && <p className="text-muted-foreground text-xs mt-1">{box.note}</p>}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4 mt-8">
                {currentStep === 1 && (
                  <>
                    <button
                      onClick={handleSubmit}
                      disabled={!selectedFile}
                      className="flex w-full cursor-pointer items-center justify-center rounded-lg h-12 px-4 bg-clientPrimary text-white text-base font-medium hover:bg-opacity-90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Submit Document
                    </button>
                    <p className="text-center text-xs text-muted-foreground flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm align-middle mr-1">lock</span>
                      Your documents are encrypted and used for verification purposes only.
                    </p>
                  </>
                )}
              </div>
            </div>
          </main>

          <footer className="mt-auto px-10 py-6 border-t border-solid border-clientBackground">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">© 2024 UniConnect. All rights reserved.</p>
              <div className="flex items-center gap-6 text-sm">
                <a className="text-muted-foreground hover:text-clientPrimary transition-colors" href="#">
                  Privacy Policy
                </a>
                <a className="text-muted-foreground hover:text-clientPrimary transition-colors" href="#">
                  Terms of Service
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default StudentVerificationPage;
