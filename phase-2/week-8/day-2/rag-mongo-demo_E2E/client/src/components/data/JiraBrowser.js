import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Link,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';

const API_BASE = 'http://localhost:3001/api';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function JiraBrowser() {
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [stories, setStories] = useState([]);
  const [selectedStoryKey, setSelectedStoryKey] = useState('');
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const loadProjects = async () => {
      setProjectsLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE}/jira/projects`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to load Jira projects');
        }
        setProjects(data.projects || []);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setProjectsLoading(false);
      }
    };

    loadProjects();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let active = true;
    setStories([]);
    setSelectedStoryKey('');
    setStatusMessage('');

    if (selectedProjects.length === 0) {
      setStoriesLoading(false);
      return () => {
        active = false;
      };
    }

    const loadStories = async () => {
      setStoriesLoading(true);
      setError('');
      try {
        const projectStoryLists = await Promise.all(selectedProjects.map(async (project) => {
          const response = await fetch(
            `${API_BASE}/jira/projects/${encodeURIComponent(project.key)}/stories?limit=100`
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.details || data.error || `Failed to load stories for ${project.key}`);
          }
          return (data.stories || []).map(story => ({
            ...story,
            projectKey: project.key,
            projectName: project.name
          }));
        }));

        if (!active) return;
        const loadedStories = projectStoryLists.flat();
        setStories(loadedStories);
        setStatusMessage(
          loadedStories.length
            ? `Loaded ${loadedStories.length} stories from ${selectedProjects.length} project(s).`
            : 'No stories were found for the selected project(s).'
        );
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setStoriesLoading(false);
      }
    };

    loadStories();
    return () => {
      active = false;
    };
  }, [selectedProjects]);

  const selectedStory = stories.find(story => story.key === selectedStoryKey) || null;
  const status = typeof selectedStory?.status === 'object'
    ? selectedStory.status?.name
    : selectedStory?.status;
  const priority = typeof selectedStory?.priority === 'object'
    ? selectedStory.priority?.name
    : selectedStory?.priority;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>
          Jira Story Browser
        </Typography>
        <Typography color="text.secondary">
          Browse accessible Jira projects and inspect user-story details.
        </Typography>
      </Box>

      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Autocomplete
              multiple
              options={projects}
              value={selectedProjects}
              disabled={projectsLoading}
              loading={projectsLoading}
              getOptionLabel={project => `${project.name} (${project.key})`}
              isOptionEqualToValue={(option, value) => option.key === value.key}
              onChange={(event, nextProjects) => {
                if (nextProjects.length > 5) {
                  setError('Select no more than five projects at a time.');
                  return;
                }
                setError('');
                setSelectedProjects(nextProjects);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Project(s)"
                  placeholder="Select one or more projects"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {projectsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
            <Autocomplete
              options={stories}
              value={selectedStory}
              disabled={storiesLoading || stories.length === 0}
              loading={storiesLoading}
              getOptionLabel={story => `${story.key} — ${story.summary}`}
              isOptionEqualToValue={(option, value) => option.key === value.key}
              onChange={(event, story) => setSelectedStoryKey(story?.key || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Stories"
                  placeholder={storiesLoading ? 'Loading stories...' : 'Select a story'}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {storiesLoading ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          {statusMessage && <Alert severity="info">{statusMessage}</Alert>}
        </CardContent>
      </Card>

      {selectedStory ? (
        <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="overline" color="text.secondary">
                  {selectedStory.key} · {selectedStory.projectName || selectedStory.projectKey}
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {selectedStory.summary || 'Untitled Jira story'}
                </Typography>
              </Box>
              {selectedStory.url && (
                <Link href={selectedStory.url} target="_blank" rel="noreferrer">
                  Open in Jira
                </Link>
              )}
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
              {status && <Chip size="small" label={`Status: ${status}`} />}
              {priority && <Chip size="small" label={`Priority: ${priority}`} />}
              <Chip size="small" variant="outlined" label={`Created: ${formatDate(selectedStory.created)}`} />
              <Chip size="small" variant="outlined" label={`Updated: ${formatDate(selectedStory.updated)}`} />
            </Stack>

            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
              Key details
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, minHeight: 150 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Description
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {selectedStory.description || 'No description provided.'}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, minHeight: 150 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Acceptance Criteria
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {selectedStory.acceptanceCriteria || 'No acceptance criteria were returned by Jira.'}
                </Typography>
              </Paper>
            </Box>

            {(selectedStory.components?.length > 0 || selectedStory.labels?.length > 0) && (
              <>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedStory.components?.map(component => (
                    <Chip key={`component-${component}`} size="small" label={component} />
                  ))}
                  {selectedStory.labels?.map(label => (
                    <Chip key={`label-${label}`} size="small" variant="outlined" label={label} />
                  ))}
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">
          Select a project and then a story to view its Jira details.
        </Alert>
      )}
    </Box>
  );
}

export default JiraBrowser;
