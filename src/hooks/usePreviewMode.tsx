import { createContext, useContext, FC, ReactNode } from 'react';
import { useUserRole } from './useUserRole';

interface PreviewModeContextType {
  isPreviewMode: boolean;
  isCenter: boolean;
  canInteract: boolean;
}

const PreviewModeContext = createContext<PreviewModeContextType>({
  isPreviewMode: false,
  isCenter: false,
  canInteract: true,
});

export const PreviewModeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { data: role, isLoading } = useUserRole();
  
  const isCenter = role === 'center';
  const isPreviewMode = isCenter;
  const canInteract = !isCenter;

  return (
    <PreviewModeContext.Provider value={{ isPreviewMode, isCenter, canInteract }}>
      {children}
    </PreviewModeContext.Provider>
  );
};

export const usePreviewMode = () => {
  const context = useContext(PreviewModeContext);
  return context;
};

// Higher-order component for preview mode protection
export const withPreviewBlock = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: { showDisabledState?: boolean }
) => {
  return (props: P) => {
    const { canInteract } = usePreviewMode();
    
    if (!canInteract && options?.showDisabledState) {
      return (
        <div className="opacity-50 pointer-events-none cursor-not-allowed">
          <WrappedComponent {...props} />
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};
