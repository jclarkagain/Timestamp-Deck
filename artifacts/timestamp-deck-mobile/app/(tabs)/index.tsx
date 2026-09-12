import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';

type Timestamp = {
  id: string;
  timeSeconds: number;
  label: string;
  notes?: string;
};

type VideoEntry = {
  id: string;
  title: string;
  url: string;
  sourceType: 'youtube' | 'local';
  localFileName?: string;
  timestamps: Timestamp[];
};

type Project = {
  id: string;
  name: string;
  videos: VideoEntry[];
};

const PROJECT_KEY = 'timestamp-deck-mobile-project';
const THEME_KEY = 'timestamp-deck-mobile-theme';

const emptyProject: Project = {
  id: 'proj-mobile',
  name: 'My Timestamp Deck',
  videos: [],
};

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remaining = safe % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(remaining)}`
    : `${pad(minutes)}:${pad(remaining)}`;
}

export function parseTimestamp(value: string): number | null {
  const input = value.trim();
  if (!input) return null;
  if (!input.includes(':')) {
    const seconds = Number(input);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
  }
  const parts = input.split(':');
  if (parts.length !== 2 && parts.length !== 3) return null;
  if (parts.some((part) => !/^\d+(?:\.\d+)?$/.test(part))) return null;
  const numbers = parts.map(Number);
  const seconds = numbers[numbers.length - 1];
  const minutes = numbers[numbers.length - 2];
  if (seconds >= 60 || minutes >= 60) return null;
  return parts.length === 3
    ? numbers[0] * 3600 + minutes * 60 + seconds
    : minutes * 60 + seconds;
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false;
  const project = value as Partial<Project>;
  return typeof project.name === 'string' && Array.isArray(project.videos);
}

function SourcePill({ sourceType, colors }: { sourceType: VideoEntry['sourceType']; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.sourcePill, { backgroundColor: colors.accent + '20' }]}>
      <Feather name={sourceType === 'local' ? 'hard-drive' : 'youtube'} size={12} color={colors.accent} />
      <Text style={[styles.sourcePillText, { color: colors.accent }]}>
        {sourceType === 'local' ? 'DEVICE FILE' : 'YOUTUBE'}
      </Text>
    </View>
  );
}

function VideoSurface({
  video,
  colors,
  onTimeChange,
  onSeekReady,
}: {
  video: VideoEntry;
  colors: ReturnType<typeof useColors>;
  onTimeChange: (seconds: number) => void;
  onSeekReady: (seek: (seconds: number) => void) => void;
}) {
  const source = video.sourceType === 'local' && video.url ? { uri: video.url } : null;
  const player = useVideoPlayer(source, (instance) => {
    instance.timeUpdateEventInterval = 1;
  });
  const timeUpdate = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: 0,
    currentOffsetFromLive: 0,
    bufferedPosition: 0,
  });
  const status = useEvent(player, 'statusChange', { status: player.status });
  const currentTime = timeUpdate?.currentTime ?? player.currentTime;

  useEffect(() => {
    onTimeChange(currentTime);
  }, [currentTime, onTimeChange]);

  useEffect(() => {
    onSeekReady((seconds) => {
      player.currentTime = seconds;
      player.play();
    });
  }, [onSeekReady, player]);

  if (video.sourceType === 'local' && video.url) {
    return (
      <View style={[styles.videoFrame, { backgroundColor: colors.playerBackground }]}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls
          fullscreenOptions={{ enable: true }}
          allowsPictureInPicture
        />
        {status.status === 'error' && (
          <View style={styles.videoStatus}>
            <Feather name="alert-circle" size={22} color={colors.accent} />
            <Text style={[styles.videoStatusText, { color: colors.primaryForeground }]}>
              This device could not open the selected video.
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.videoFrame, { backgroundColor: colors.primary }]}>
      <Feather name="youtube" size={34} color={colors.accent} />
      <Text style={[styles.videoPlaceholderTitle, { color: colors.primaryForeground }]}>
        YouTube video ready
      </Text>
      <Text style={[styles.videoPlaceholderText, { color: colors.primaryForeground + 'b8' }]}>
        Open the link to watch it, or choose a device file for native playback and timestamp capture.
      </Text>
      <Pressable
        testID="button-open-youtube"
        style={[styles.smallButton, { backgroundColor: colors.accent }]}
        onPress={() => void Linking.openURL(video.url)}
      >
        <Feather name="external-link" size={15} color={colors.accentForeground} />
        <Text style={[styles.smallButtonText, { color: colors.accentForeground }]}>Open YouTube</Text>
      </Pressable>
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  colors,
  destructive = false,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      testID={`button-${label.toLowerCase().replace(/\s+/g, '-')}`}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Feather name={icon} size={17} color={destructive ? colors.destructive : colors.mutedForeground} />
    </Pressable>
  );
}

export default function WorkspaceScreen() {
  const insets = useSafeAreaInsets();
  const [isDark, setIsDark] = useState(false);
  const colors = useColors(isDark ? 'dark' : 'light');
  const [project, setProject] = useState<Project>(emptyProject);
  const [hydrated, setHydrated] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [videoType, setVideoType] = useState<VideoEntry['sourceType']>('youtube');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pickedFileName, setPickedFileName] = useState('');
  const [pickedFileUri, setPickedFileUri] = useState('');
  const [videoError, setVideoError] = useState('');
  const [timestampModal, setTimestampModal] = useState<{ id?: string; time: string; label: string } | null>(null);
  const [notesModal, setNotesModal] = useState<{ id: string; notes: string } | null>(null);
  const currentTimeRef = useRef(0);
  const seekPlayerRef = useRef<((seconds: number) => void) | null>(null);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(PROJECT_KEY), AsyncStorage.getItem(THEME_KEY)])
      .then(([savedProject, savedTheme]) => {
        if (savedProject) {
          try {
            const parsed: unknown = JSON.parse(savedProject);
            if (isProject(parsed)) setProject(parsed);
          } catch {
            // Keep the clean starter project when stored data is invalid.
          }
        }
        if (savedTheme === 'dark') setIsDark(true);
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) void AsyncStorage.setItem(PROJECT_KEY, JSON.stringify(project));
  }, [hydrated, project]);

  useEffect(() => {
    if (hydrated) void AsyncStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [hydrated, isDark]);

  const activeVideo = useMemo(
    () => project.videos.find((video) => video.id === activeVideoId) ?? project.videos[0],
    [activeVideoId, project.videos],
  );

  const updateProjectVideo = (updatedVideo: VideoEntry) => {
    setProject((current) => ({
      ...current,
      videos: current.videos.map((video) => (video.id === updatedVideo.id ? updatedVideo : video)),
    }));
  };

  const pickVideo = async () => {
    setVideoError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setVideoError('Allow photo and video access to choose a device file.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedFileUri(result.assets[0].uri);
      setPickedFileName(result.assets[0].fileName ?? 'Selected video');
    }
  };

  const resetAddVideo = () => {
    setShowAddVideo(false);
    setVideoTitle('');
    setVideoUrl('');
    setPickedFileName('');
    setPickedFileUri('');
    setVideoError('');
    setVideoType('youtube');
  };

  const addVideo = () => {
    setVideoError('');
    if (videoType === 'youtube' && !videoUrl.trim()) {
      setVideoError('Paste a YouTube link first.');
      return;
    }
    if (videoType === 'local' && !pickedFileUri) {
      setVideoError('Choose a video file first.');
      return;
    }
    const video: VideoEntry = {
      id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: videoTitle.trim() || pickedFileName.replace(/\.[^/.]+$/, '') || 'Untitled video',
      url: videoType === 'local' ? pickedFileUri : videoUrl.trim(),
      sourceType: videoType,
      localFileName: videoType === 'local' ? pickedFileName : undefined,
      timestamps: [],
    };
    setProject((current) => ({ ...current, videos: [...current.videos, video] }));
    setActiveVideoId(video.id);
    resetAddVideo();
  };

  const removeVideo = (video: VideoEntry) => {
    Alert.alert('Remove video?', `This removes ${video.title} and its timestamps from the project.`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setProject((current) => ({ ...current, videos: current.videos.filter((item) => item.id !== video.id) }));
          if (activeVideoId === video.id) setActiveVideoId(null);
        },
      },
    ]);
  };

  const addTimestamp = (time: number) => {
    setTimestampModal({ time: formatTime(time), label: '' });
  };

  const saveTimestamp = () => {
    if (!activeVideo || !timestampModal) return;
    const seconds = parseTimestamp(timestampModal.time);
    if (seconds === null) {
      Alert.alert('Check the time', 'Use MM:SS, HH:MM:SS, or a number of seconds.');
      return;
    }
    const label = timestampModal.label.trim() || 'Untitled moment';
    const timestamps = timestampModal.id
      ? activeVideo.timestamps.map((timestamp) =>
          timestamp.id === timestampModal.id ? { ...timestamp, timeSeconds: seconds, label } : timestamp,
        )
      : [
          ...activeVideo.timestamps,
          { id: `ts-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timeSeconds: seconds, label },
        ];
    updateProjectVideo({ ...activeVideo, timestamps });
    setTimestampModal(null);
  };

  const deleteTimestamp = (timestamp: Timestamp) => {
    if (!activeVideo) return;
    Alert.alert('Delete timestamp?', timestamp.label, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => updateProjectVideo({
          ...activeVideo,
          timestamps: activeVideo.timestamps.filter((item) => item.id !== timestamp.id),
        }),
      },
    ]);
  };

  const saveNotes = () => {
    if (!activeVideo || !notesModal) return;
    updateProjectVideo({
      ...activeVideo,
      timestamps: activeVideo.timestamps.map((timestamp) =>
        timestamp.id === notesModal.id ? { ...timestamp, notes: notesModal.notes.trim() } : timestamp,
      ),
    });
    setNotesModal(null);
  };

  const exportProject = async () => {
    await Share.share({
      title: `${project.name}.json`,
      message: JSON.stringify(project, null, 2),
    });
  };

  const importProject = () => {
    try {
      const parsed: unknown = JSON.parse(importText);
      if (!isProject(parsed) || !parsed.videos.every((video) => Array.isArray(video.timestamps))) {
        throw new Error('invalid');
      }
      setProject(parsed);
      setActiveVideoId(parsed.videos[0]?.id ?? null);
      setImportText('');
      setShowImport(false);
    } catch {
      Alert.alert('Could not import', 'Paste a Timestamp Deck project JSON export.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 30,
          paddingHorizontal: 18,
        }}
        keyboardDismissMode="interactive"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandLockup}>
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
              <Feather name="bookmark" size={19} color={colors.primaryForeground} />
            </View>
            <View>
              <Text style={[styles.brandName, { color: colors.foreground }]}>Timestamp Deck</Text>
              <Text style={[styles.brandKicker, { color: colors.mutedForeground }]}>Mobile workspace</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              testID="button-toggle-theme"
              accessibilityLabel="Toggle dark mode"
              onPress={() => setIsDark((value) => !value)}
              style={styles.themeButton}
            >
              <Feather name={isDark ? 'sun' : 'moon'} size={18} color={colors.mutedForeground} />
              <Switch
                value={isDark}
                onValueChange={setIsDark}
                trackColor={{ false: colors.secondary, true: colors.accent + '80' }}
                thumbColor={isDark ? colors.accent : colors.card}
                accessibilityLabel="Dark mode"
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>A personal index for moving images</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Make every second{'\n'}<Text style={{ color: colors.primary }}>count.</Text></Text>
          <View style={[styles.introRule, { borderTopColor: colors.accent }]}>
            <Text style={[styles.introMeta, { color: colors.mutedForeground }]}>
              {project.videos.length} {project.videos.length === 1 ? 'source' : 'sources'}
            </Text>
            <Text style={[styles.introMeta, { color: colors.mutedForeground }]}>
              {project.videos.reduce((total, video) => total + video.timestamps.length, 0)} filed moments
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your shelf</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>Choose a source to work through.</Text>
          </View>
          <Pressable
            testID="button-add-video"
            accessibilityLabel="Add video"
            onPress={() => setShowAddVideo(true)}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={17} color={colors.primaryForeground} />
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Add source</Text>
          </Pressable>
        </View>

        {project.videos.length === 0 ? (
          <View style={[styles.emptyShelf, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent + '18' }]}>
              <Feather name="film" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Start your first deck.</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add a YouTube link or a video stored on this device. Your project stays available offline.
            </Text>
          </View>
        ) : (
          <View style={styles.shelf}>
            {project.videos.map((video, index) => (
              <Pressable
                key={video.id}
                testID={`button-video-${video.id}`}
                onPress={() => setActiveVideoId(video.id)}
                style={[
                  styles.videoCard,
                  { backgroundColor: colors.card, borderColor: activeVideo?.id === video.id ? colors.accent : colors.border },
                ]}
              >
                <View style={[styles.videoNumber, { backgroundColor: activeVideo?.id === video.id ? colors.accent + '22' : colors.muted }]}>
                  <Text style={[styles.videoNumberText, { color: activeVideo?.id === video.id ? colors.accent : colors.mutedForeground }]}>
                    {(index + 1).toString().padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.videoCardCopy}>
                  <Text numberOfLines={1} style={[styles.videoCardTitle, { color: colors.foreground }]}>{video.title}</Text>
                  <Text numberOfLines={1} style={[styles.videoCardSubtitle, { color: colors.mutedForeground }]}>
                    {video.sourceType === 'local' ? video.localFileName ?? 'Device file' : 'YouTube link'}
                  </Text>
                </View>
                <SourcePill sourceType={video.sourceType} colors={colors} />
              </Pressable>
            ))}
          </View>
        )}

        {activeVideo && (
          <>
            <View style={[styles.playerPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.playerTopline}>
                <View style={styles.playerCopy}>
                  <Text numberOfLines={1} style={[styles.playerTitle, { color: colors.foreground }]}>{activeVideo.title}</Text>
                  <Text style={[styles.playerLabel, { color: colors.mutedForeground }]}>
                    {activeVideo.timestamps.length} {activeVideo.timestamps.length === 1 ? 'mark' : 'marks'} filed
                  </Text>
                </View>
                <IconButton icon="trash-2" label="Remove video" onPress={() => removeVideo(activeVideo)} colors={colors} destructive />
              </View>
              <VideoSurface
                video={activeVideo}
                colors={colors}
                onTimeChange={(seconds) => { currentTimeRef.current = seconds; }}
                onSeekReady={(seek) => { seekPlayerRef.current = seek; }}
              />
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Filed moments</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
                  Tap a time to jump back into the source.
                </Text>
              </View>
              <View style={styles.timestampActions}>
                <Pressable
                  testID="button-add-manual-timestamp"
                  accessibilityLabel="Add timestamp manually"
                  onPress={() => addTimestamp(0)}
                  style={[styles.outlineButton, { borderColor: colors.border }]}
                >
                  <Feather name="edit-3" size={14} color={colors.foreground} />
                  <Text style={[styles.outlineButtonText, { color: colors.foreground }]}>Manual</Text>
                </Pressable>
                <Pressable
                  testID="button-capture-timestamp"
                  accessibilityLabel="Capture current timestamp"
                  onPress={() => addTimestamp(currentTimeRef.current)}
                  style={[styles.accentButton, { backgroundColor: colors.accent }]}
                >
                  <Feather name="crosshair" size={14} color={colors.accentForeground} />
                  <Text style={[styles.accentButtonText, { color: colors.accentForeground }]}>Capture</Text>
                </Pressable>
              </View>
            </View>

            {activeVideo.timestamps.length === 0 ? (
              <View style={[styles.emptyShelf, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.accent + '18' }]}>
                  <Feather name="crosshair" size={20} color={colors.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Leave a pin in the film.</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Capture the current player time or enter a moment manually.
                </Text>
              </View>
            ) : (
              <View style={styles.timestampList}>
                {activeVideo.timestamps.map((timestamp, index) => (
                  <View key={timestamp.id} style={[styles.timestampCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.timestampIndex, { backgroundColor: colors.accent + '18' }]}>
                      <Text style={[styles.timestampIndexText, { color: colors.accent }]}>{(index + 1).toString().padStart(2, '0')}</Text>
                    </View>
                    <View style={styles.timestampCopy}>
                      <Pressable
                        testID={`button-seek-${timestamp.id}`}
                        onPress={() => {
                          if (activeVideo.sourceType === 'local') {
                            seekPlayerRef.current?.(timestamp.timeSeconds);
                          } else {
                            void Linking.openURL(activeVideo.url);
                          }
                        }}
                      >
                        <Text style={[styles.timestampTime, { color: colors.accent, backgroundColor: colors.accent + '14' }]}>{formatTime(timestamp.timeSeconds)}</Text>
                      </Pressable>
                      <Text numberOfLines={1} style={[styles.timestampLabel, { color: colors.foreground }]}>{timestamp.label}</Text>
                      {!!timestamp.notes && <Text numberOfLines={2} style={[styles.timestampNotes, { color: colors.mutedForeground }]}>{timestamp.notes}</Text>}
                    </View>
                    <View style={styles.timestampControls}>
                      <IconButton icon="clock" label="Edit time" onPress={() => setTimestampModal({ id: timestamp.id, time: formatTime(timestamp.timeSeconds), label: timestamp.label })} colors={colors} />
                      <IconButton icon="file-text" label="Edit notes" onPress={() => setNotesModal({ id: timestamp.id, notes: timestamp.notes ?? '' })} colors={colors} />
                      <IconButton icon="trash-2" label="Delete timestamp" onPress={() => deleteTimestamp(timestamp)} colors={colors} destructive />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={[styles.toolsPanel, { borderTopColor: colors.border }]}>
          <View style={styles.toolsHeading}>
            <Text style={[styles.toolsTitle, { color: colors.foreground }]}>Project tools</Text>
            <Text style={[styles.toolsSubtitle, { color: colors.mutedForeground }]}>Portable, private, and stored on this device.</Text>
          </View>
          <View style={styles.toolsRow}>
            <Pressable testID="button-export-project" onPress={() => void exportProject()} style={[styles.toolButton, { backgroundColor: colors.secondary }]}>
              <Feather name="upload" size={16} color={colors.foreground} />
              <Text style={[styles.toolButtonText, { color: colors.foreground }]}>Export JSON</Text>
            </Pressable>
            <Pressable testID="button-import-project" onPress={() => setShowImport(true)} style={[styles.toolButton, { backgroundColor: colors.secondary }]}>
              <Feather name="download" size={16} color={colors.foreground} />
              <Text style={[styles.toolButtonText, { color: colors.foreground }]}>Import JSON</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>

      <Modal visible={showAddVideo} animationType="slide" transparent onRequestClose={resetAddVideo}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.primary + 'b8' }]}>
          <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.modalCard, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]} bottomOffset={24}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add a source</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>Choose what you want to file.</Text>
              </View>
              <IconButton icon="x" label="Close" onPress={resetAddVideo} colors={colors} />
            </View>
            <View style={styles.sourceToggle}>
              {(['youtube', 'local'] as const).map((type) => (
                <Pressable
                  key={type}
                  testID={`button-source-${type}`}
                  onPress={() => setVideoType(type)}
                  style={[styles.sourceOption, { borderColor: videoType === type ? colors.accent : colors.border, backgroundColor: videoType === type ? colors.accent + '12' : 'transparent' }]}
                >
                  <Feather name={type === 'local' ? 'hard-drive' : 'youtube'} size={15} color={videoType === type ? colors.accent : colors.mutedForeground} />
                  <Text style={[styles.sourceOptionText, { color: videoType === type ? colors.accent : colors.mutedForeground }]}>{type === 'local' ? 'Device file' : 'YouTube'}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Title</Text>
            <TextInput testID="input-video-title" value={videoTitle} onChangeText={setVideoTitle} placeholder="Optional title" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.input }]} />
            {videoType === 'youtube' ? (
              <>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>YouTube link</Text>
                <TextInput testID="input-video-url" value={videoUrl} onChangeText={setVideoUrl} autoCapitalize="none" keyboardType="url" placeholder="https://youtube.com/watch?v=..." placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.input }]} />
              </>
            ) : (
              <Pressable testID="button-pick-video" onPress={() => void pickVideo()} style={[styles.filePicker, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Feather name={pickedFileName ? 'check-circle' : 'upload-cloud'} size={20} color={colors.accent} />
                <Text numberOfLines={1} style={[styles.filePickerText, { color: colors.foreground }]}>{pickedFileName || 'Choose a video from this device'}</Text>
              </Pressable>
            )}
            {!!videoError && <Text style={[styles.errorText, { color: colors.destructive }]}>{videoError}</Text>}
            <Pressable testID="button-save-video" onPress={addVideo} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>Add to shelf</Text>
            </Pressable>
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>

      <Modal visible={timestampModal !== null} animationType="slide" transparent onRequestClose={() => setTimestampModal(null)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.primary + 'b8' }]}>
          <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.modalCard, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]} bottomOffset={24}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>{timestampModal?.id ? 'Edit moment' : 'File a moment'}</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>MM:SS, HH:MM:SS, or seconds.</Text>
              </View>
              <IconButton icon="x" label="Close timestamp editor" onPress={() => setTimestampModal(null)} colors={colors} />
            </View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Time</Text>
            <TextInput testID="input-timestamp-time" value={timestampModal?.time ?? ''} onChangeText={(time) => setTimestampModal((current) => current ? { ...current, time } : current)} placeholder="00:00" placeholderTextColor={colors.mutedForeground} keyboardType="numbers-and-punctuation" style={[styles.input, styles.monoInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.input }]} />
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Label</Text>
            <TextInput testID="input-timestamp-label" value={timestampModal?.label ?? ''} onChangeText={(label) => setTimestampModal((current) => current ? { ...current, label } : current)} placeholder="What happens here?" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.input }]} />
            <Pressable testID="button-save-timestamp" onPress={saveTimestamp} style={[styles.saveButton, { backgroundColor: colors.accent }]}>
              <Text style={[styles.saveButtonText, { color: colors.accentForeground }]}>Save moment</Text>
            </Pressable>
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>

      <Modal visible={notesModal !== null} animationType="slide" transparent onRequestClose={() => setNotesModal(null)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.primary + 'b8' }]}>
          <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.modalCard, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]} bottomOffset={24}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Notes</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>Add context to this filed moment.</Text>
              </View>
              <IconButton icon="x" label="Close notes editor" onPress={() => setNotesModal(null)} colors={colors} />
            </View>
            <TextInput testID="input-timestamp-notes" multiline value={notesModal?.notes ?? ''} onChangeText={(notes) => setNotesModal((current) => current ? { ...current, notes } : current)} placeholder="Write a short note..." placeholderTextColor={colors.mutedForeground} style={[styles.input, styles.notesInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.input }]} />
            <Pressable testID="button-save-notes" onPress={saveNotes} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>Save notes</Text>
            </Pressable>
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>

      <Modal visible={showImport} animationType="slide" transparent onRequestClose={() => setShowImport(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.primary + 'b8' }]}>
          <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.modalCard, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]} bottomOffset={24}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Import project</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>Paste a JSON export from Timestamp Deck.</Text>
              </View>
              <IconButton icon="x" label="Close import" onPress={() => setShowImport(false)} colors={colors} />
            </View>
            <TextInput testID="input-import-json" multiline value={importText} onChangeText={setImportText} autoCapitalize="none" autoCorrect={false} placeholder="{ ... }" placeholderTextColor={colors.mutedForeground} style={[styles.input, styles.importInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.input }]} />
            <Pressable testID="button-import-json" onPress={importProject} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>Import project</Text>
            </Pressable>
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 38, height: 38, borderRadius: 12, borderBottomLeftRadius: 3, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-3deg' }] },
  brandName: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.5 },
  brandKicker: { fontFamily: 'Inter_500Medium', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  themeButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  intro: { marginBottom: 28 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 9 },
  title: { fontFamily: 'Inter_400Regular', fontSize: 43, lineHeight: 43, letterSpacing: -2.2 },
  introRule: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingTop: 11, marginTop: 21, borderTopWidth: 2 },
  introMeta: { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 0.2 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 13 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 21, letterSpacing: -0.7 },
  sectionSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  primaryButton: { minHeight: 40, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12 },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  shelf: { gap: 8, marginBottom: 26 },
  videoCard: { minHeight: 62, borderWidth: 1, borderRadius: 13, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  videoNumber: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  videoNumberText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  videoCardCopy: { flex: 1, minWidth: 0 },
  videoCardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  videoCardSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  sourcePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 7 },
  sourcePillText: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.6 },
  emptyShelf: { minHeight: 176, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 26, marginBottom: 26 },
  emptyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7, maxWidth: 310 },
  playerPanel: { overflow: 'hidden', borderWidth: 1, borderRadius: 15, marginBottom: 27 },
  playerTopline: { minHeight: 60, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  playerCopy: { flex: 1, minWidth: 0 },
  playerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  playerLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  videoFrame: { minHeight: 220, aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center', padding: 26 },
  video: { width: '100%', height: '100%' },
  videoStatus: { position: 'absolute', left: 18, right: 18, bottom: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  videoStatusText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11 },
  videoPlaceholderTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 10 },
  videoPlaceholderText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 7, maxWidth: 260, marginBottom: 14 },
  smallButton: { minHeight: 36, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11 },
  smallButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  timestampActions: { flexDirection: 'row', gap: 6 },
  outlineButton: { minHeight: 36, borderWidth: 1, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9 },
  outlineButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  accentButton: { minHeight: 36, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9 },
  accentButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  timestampList: { gap: 8, marginBottom: 28 },
  timestampCard: { minHeight: 88, borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  timestampIndex: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  timestampIndexText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  timestampCopy: { flex: 1, minWidth: 0 },
  timestampTime: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 5, fontFamily: 'Inter_700Bold', fontSize: 11 },
  timestampLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 7 },
  timestampNotes: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 5 },
  timestampControls: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  iconButton: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.55 },
  toolsPanel: { borderTopWidth: 1, paddingTop: 23, marginTop: 2 },
  toolsHeading: { marginBottom: 12 },
  toolsTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  toolsSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  toolsRow: { flexDirection: 'row', gap: 8 },
  toolButton: { flex: 1, minHeight: 42, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  toolButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 22 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 21 },
  modalTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 22, letterSpacing: -0.6 },
  modalSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  sourceToggle: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  sourceOption: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  sourceOptionText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  fieldLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7, marginTop: 13 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, fontFamily: 'Inter_400Regular', fontSize: 14 },
  monoInput: { fontFamily: 'Inter_500Medium' },
  filePicker: { minHeight: 58, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 13 },
  filePickerText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 11 },
  saveButton: { minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 21 },
  saveButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  notesInput: { minHeight: 130, paddingTop: 12, textAlignVertical: 'top' },
  importInput: { minHeight: 220, paddingTop: 12, textAlignVertical: 'top', fontFamily: Platform.OS === 'web' ? 'monospace' : 'Inter_400Regular', fontSize: 12 },
});