import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApprovedDocuments } from '@/hooks/useApprovedDocuments';
import { ProjectDocumentFolder } from '@/components/documents/ProjectDocumentFolder';
import { 
  FileText, 
  Search, 
  Palette,
  HardHat,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Approved Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Files and photos from completed tasks, organized by project
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
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass-card animate-pulse">
                  <div className="h-14 bg-muted rounded-t-lg" />
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
            <div className="space-y-4">
              {Object.entries(groupedByProject).map(([projectId, { project_name, documents: projectDocs }]) => (
                <ProjectDocumentFolder
                  key={projectId}
                  projectName={project_name}
                  documents={projectDocs}
                  activeTab={activeTab as 'all' | 'design' | 'execution'}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Documents;
