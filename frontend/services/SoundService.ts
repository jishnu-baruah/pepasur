import { Howl } from 'howler';

class SoundService {
  private isMuted: boolean = true;
  private sounds: Map<string, Howl> = new Map();

  constructor() {
    // Load all sounds once
    this.sounds.set('loading', new Howl({
      src: ['https://ik.imagekit.io/0whwkbkhd/1-108.mp3?updatedAt=1758961515678'],
      volume: 0.5
    }));

    this.sounds.set('click', new Howl({
      src: ['https://ik.imagekit.io/0whwkbkhd/mouse-click-sound-effect.mp3?updatedAt=1758961712419'],
      volume: 0.3
    }));

    this.sounds.set('gameStart', new Howl({
      src: ['https://ik.imagekit.io/0whwkbkhd/086354_8-bit-arcade-video-game-start-sound-effect-gun-reload-and-jump-81124.mp3?updatedAt=1758962003137'],
      volume: 0.6
    }));

    this.sounds.set('pepasurLaugh', new Howl({
      src: ['https://ik.imagekit.io/0whwkbkhd/boo-and-laugh-7060.mp3?updatedAt=1758962467284'],
      volume: 0.5
    }));

    this.sounds.set('angelic', new Howl({
      src: ['https://ik.imagekit.io/0whwkbkhd/angelchoirmarktreekort.mp3?updatedAt=1758962559744'],
      volume: 0.4
    }));

    this.sounds.set('detective', new Howl({
      src: ['https://ik.imagekit.io/0whwkbkhd/mystery-thriller.mp3?updatedAt=1758962994706'],
      volume: 0.5
    }));

    this.sounds.set('killing', new Howl({
      src: ['https://ik.imagekit.io/0whwkbkhd/dark-souls-kill.mp3?updatedAt=1758963253515'],
      volume: 0.5
    }));

    this.sounds.set('taskComplete', new Howl({
      src: ['https://ik.imagekit.io/0whwkbkhd/bonus-points-190035.mp3?updatedAt=1758963976527'],
      volume: 0.5
    }));

    this.sounds.set('elimination', new Howl({
      src: ['https://ik.imagekit.io/0whwkbkhd/laughing-dog-meme.mp3?updatedAt=1758964154773'],
      volume: 0.5
    }));

    // Load mute state from localStorage, otherwise keep the default
    if (typeof window !== 'undefined') {
      const savedMuteState = localStorage.getItem('soundMuted');
      if (savedMuteState !== null) {
        this.isMuted = savedMuteState === 'true';
      }
    }
  }

  private play(soundKey: string) {
    if (this.isMuted) return;

    const sound = this.sounds.get(soundKey);
    if (sound) {
      sound.play();
    }
  }

  // Public methods for different game events
  playLoading() {
    this.play('loading');
  }

  playClick() {
    this.play('click');
  }

  playGameStart() {
    this.play('gameStart');
  }

  playPepasurLaugh() {
    this.play('pepasurLaugh');
  }

  playAngelic() {
    this.play('angelic');
  }

  playDetective() {
    this.play('detective');
  }

  playKilling() {
    this.play('killing');
  }

  playTaskComplete() {
    this.play('taskComplete');
  }

  playElimination() {
    this.play('elimination');
  }

  // Backward compatibility - map old methods to new sounds
  playPhaseChange() {
    this.play('gameStart');
  }

  playVote() {
    this.play('click');
  }

  playMessage() {
    this.play('click');
  }

  // Mute controls
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundMuted', String(this.isMuted));
    }
    return this.isMuted;
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundMuted', String(this.isMuted));
    }
  }

  getMuteState(): boolean {
    return this.isMuted;
  }
}

// Export singleton instance
export const soundService = new SoundService();
