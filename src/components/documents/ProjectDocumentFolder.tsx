import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FolderOpen, 
  Folder,
  ChevronRight,
  Palette,
  HardHat,
  FileText,
  Download,
  ExternalLink,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

interface DocumentFile {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  task_name: string;
  type: 'design' | 'execution';
}

interface ProjectDocumentFolderProps {
  projectName: string;
  documents: DocumentFile[];
}

const isImageFile = (url: string) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
  return imageExtensions.some(ext => url.toLowerCase().includes(ext));
};

const DocumentCard: React.FC<{ doc: DocumentFile }> = ({ doc }) => (
  <Card className="glass-card overflow-hidden group hover:shadow-lg transition-shadow">
    <div className="aspect-video bg-muted/50 relative overflow-hidden">
      {isImageFile(doc.file_url) ? (
        <img
          src={doc.file_url}
          alt={doc.file_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div className={`absolute inset-0 flex items-center justify-center ${isImageFile(doc.file_url) ? 'hidden' : ''}`}>
        <FileText className="w-12 h-12 text-muted-foreground" />
      </div>
      <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Approved
      </Badge>
    </div>
    
    <CardContent className="p-4">
      <h3 className="font-medium text-foreground truncate mb-1">
        {doc.file_name}
      </h3>
      <p className="text-sm text-muted-foreground mb-3">
        Task: {doc.task_name}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.open(doc.file_url, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <a href={doc.file_url} download={doc.file_name}>
              <Download className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const SubFolder: React.FC<{
  title: string;
  icon: React.ReactNode;
  documents: DocumentFile[];
  defaultOpen?: boolean;
}> = ({ title, icon, documents, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-12 px-4 hover:bg-muted/50"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          {isOpen ? <FolderOpen className="w-5 h-5 text-primary" /> : <Folder className="w-5 h-5 text-muted-foreground" />}
          {icon}
          <span className="font-medium">{title}</span>
          <Badge variant="secondary" className="ml-auto">
            {documents.length} files
          </Badge>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {documents.length === 0 ? (
          <div className="pl-12 py-4 text-sm text-muted-foreground">
            No approved files yet
          </div>
        ) : (
          <div className="pl-8 pr-4 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const ProjectDocumentFolder: React.FC<ProjectDocumentFolderProps> = ({
  projectName,
  documents,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const designDocs = documents.filter(d => d.type === 'design');
  const executionDocs = documents.filter(d => d.type === 'execution');

  return (
    <Card className="glass-card overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-14 px-4 hover:bg-muted/50 rounded-none border-b border-border/50"
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            {isOpen ? (
              <FolderOpen className="w-6 h-6 text-primary" />
            ) : (
              <Folder className="w-6 h-6 text-primary" />
            )}
            <span className="font-display font-semibold text-lg">{projectName}</span>
            <Badge variant="outline" className="ml-auto">
              {documents.length} files
            </Badge>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="divide-y divide-border/30">
            <SubFolder
              title="Design Work"
              icon={<Palette className="w-4 h-4 text-primary" />}
              documents={designDocs}
              defaultOpen={designDocs.length > 0}
            />
            <SubFolder
              title="Execution Work"
              icon={<HardHat className="w-4 h-4 text-warning" />}
              documents={executionDocs}
              defaultOpen={executionDocs.length > 0 && designDocs.length === 0}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
