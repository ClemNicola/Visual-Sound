import p5 from "p5";

const Y2K = "/music/y2k.mp3";
const ROCK_BODY = "/music/rock_body.mp3";
const AMORE = "/music/amore.mp3";
const GEM_LINGO = "/music/gem_lingo.mp3";
const EXCUSE_ME = "/music/excuse_me.mp3";
const HEAL = "/music/heal.mp3";
const I_THINK_OF_YOU = "/music/i_think_of_you.mp3";
const MUTUAL_CONTENT = "/music/mutual_content.mp3";
const READ_THREAD = "/music/read_thread.mp3";
const SCARED_GEOMETRY = "/music/scared_geometry.mp3";
const SIENTE = "/music/siente.mp3";

const Y2K_COVER = "/images/y2k.webp";
const ROCK_BODY_COVER = "/images/rock_body.webp";
const AMORE_COVER = "/images/amore_tossico.webp";
const GEM_LINGO_COVER = "/images/gem_lingo.webp";
const EXCUSE_ME_COVER = "/images/excuse_moi.webp";
const HEAL_COVER = "/images/heal_my_soul.webp";
const I_THINK_OF_YOU_COVER = "/images/bigroom_sensual.webp";
const MUTUAL_CONTENT_COVER = "/images/mutual_content.webp";
const READ_THREAD_COVER = "/images/read_threads.webp";
const SCARED_GEOMETRY_COVER = "/images/scared_geometry.webp";
const SIENTE_COVER = "/images/bigroom_sensual.webp";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  song: string;
}

export const DATA_SONGS: Song[] = [
  {
    id: "y2k",
    title: "Y2K - Rewind(Remix)",
    artist: "Mac Declos x Anetha",
    album: "Nothing Stands Still",
    cover: Y2K_COVER,
    song: Y2K,
  },
  {
    id: "rock_body",
    title: "Rock Body",
    artist: "Stef de Haan",
    album: "Single",
    cover: ROCK_BODY_COVER,
    song: ROCK_BODY,
  },
  {
    id: "amore",
    title: "Amore Tossico",
    artist: "FRAN LF",
    album: "Single",
    cover: AMORE_COVER,
    song: AMORE,
  },
  {
    id: "gem_lingo",
    title: "Gem Lingo (ovr now)",
    artist: "Overmono x Ruthven",
    album: "Single",
    cover: GEM_LINGO_COVER,
    song: GEM_LINGO,
  },
  {
    id: "excuse_me",
    title: "Excuse Me",
    artist: "Eargasm God x Liv del Estal",
    album: "Single",
    cover: EXCUSE_ME_COVER,
    song: EXCUSE_ME,
  },
  {
    id: "heal",
    title: "Heal My Soul",
    artist: "ANNĒ",
    album: "Symbiosis",
    cover: HEAL_COVER,
    song: HEAL,
  },
  {
    id: "i_think_of_you",
    title: "I Think Of You (sometimes)",
    artist: "Dj Gigola",
    album: "Bigroom Sensual",
    cover: I_THINK_OF_YOU_COVER,
    song: I_THINK_OF_YOU,
  },
  {
    id: "mutual_content",
    title: "Mutual Content",
    artist: "Hyden",
    album: "To Whom It May Concern",
    cover: MUTUAL_CONTENT_COVER,
    song: MUTUAL_CONTENT,
  },
  {
    id: "read_thread",
    title: "Read Thread",
    artist: "MAURER",
    album: "Between Frames",
    cover: READ_THREAD_COVER,
    song: READ_THREAD,
  },
  {
    id: "scared_geometry",
    title: "Scared Geometry",
    artist: "Mac Declos ",
    album: "Hard work always pay off",
    cover: SCARED_GEOMETRY_COVER,
    song: SCARED_GEOMETRY,
  },
  {
    id: "siente",
    title: "Siente",
    artist: "Dj Gigola",
    album: "Bigroom Sensual",
    cover: SIENTE_COVER,
    song: SIENTE,
  },
];
