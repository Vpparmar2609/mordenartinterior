import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApprovedDocuments } from '@/hooks/useApprovedDocuments';
import { 
  FileText, 
  Search, 
  Download, 
  ExternalLink,
  Palette,
  HardHat,
  CheckCircle2,
  Calendar,
  FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';

const Documents: React.FC = () => {
  const { documents, isLoading } = useApprovedDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.task_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'design') return matchesSearch && doc.type === 'design';
    if (activeTab === 'execution') return matchesSearch && doc.type === 'execution';
    return matchesSearch;
  });

  const designCount = documents.filter(d => d.type === 'design').length;
  const executionCount = documents.filter(d => d.type === 'execution').length;

  // Group documents by project
  const groupedByProject = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.project_id]) {
      acc[doc.project_id] = {
        project_name: doc.project_name,
        documents: [],
      };
    }
    acc[doc.project_id].documents.push(doc);
    return acc;
  }, {} as Record<string, { project_name: string; documents: typeof filteredDocuments }>);

  const isImageFile = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Approved Documents
            </h1>
            <p className="text-muted-foreground mt-1">
              Files and photos from completed tasks, confirmed by department heads
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {documents.length} Approved
            </Badge>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by file name, project, or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full sm:w-auto grid-cols-3 gap-1">
            <TabsTrigger value="all" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              All ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="design" className="gap-2">
              <Palette className="w-4 h-4" />
              Design ({designCount})
            </TabsTrigger>
            <TabsTrigger value="execution" className="gap-2">
              <HardHat className="w-4 h-4" />
              Execution ({executionCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="glass-card animate-pulse">
                    <div className="aspect-video bg-muted rounded-t-lg" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : Object.keys(groupedByProject).length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No Approved Documents Yet
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Documents will appear here automatically when design or execution tasks are marked as completed by department heads.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedByProject).map(([projectId, { project_name, documents: projectDocs }]) => (
                  <div key={projectId}>
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-semibold text-foreground">{project_name}</h2>
                      <Badge variant="outline">{projectDocs.length} files</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projectDocs.map((doc) => (
                        <Card key={doc.id} className="glass-card overflow-hidden group hover:shadow-lg transition-shadow">
                          {/* Preview */}
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
                            {/* Type badge */}
                            <Badge 
                              className={`absolute top-2 left-2 ${
                                doc.type === 'design' 
                                  ? 'bg-primary/90 text-primary-foreground' 
                                  : 'bg-amber-500/90 text-white'
                              }`}
                            >
                              {doc.type === 'design' ? (
                                <><Palette className="w-3 h-3 mr-1" /> Design</>
                              ) : (
                                <><HardHat className="w-3 h-3 mr-1" /> Execution</>
                              )}
                            </Badge>
                            {/* Approved badge */}
                            <Badge 
                              className="absolute top-2 right-2 bg-accent text-accent-foreground"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          </div>
                          
                          {/* Info */}
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
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
};


export default Documents;
