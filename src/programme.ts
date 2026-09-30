// Turns the programme answer of content/csessions into a simple "movies now showing" list.
//
// Field names come from the kiosk app's response model: a movie has title/name, certification,
// runTimeStr and experienceSessions; each experience has shows with showTime and screenName.
// The walk below does not depend on the exact nesting, so it keeps working if the API adds levels.

/** One movie with all its showtimes found in the programme. */
export interface MovieShowing {
  title: string;
  certification: string;
  runTime: string;
  experiences: string[];
  showtimes: string[];
  screens: string[];
}

type Json = Record<string, unknown>;

// Read a field as text, or return '' when it is missing.
const text = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? String(value) : '');

/** Finds every movie in the programme output and merges its showtimes across days/experiences. */
export function extractMovies(output: unknown): MovieShowing[] {
  // Movies keyed by title, so the same film on several days is listed once.
  const byTitle = new Map<string, MovieShowing>();

  // Step 1: walk the whole answer looking for movie objects.
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    const o = node as Json;
    // The film's details are either on the object itself or in a "movie" object next to its sessions
    // (the programme answer has daySessions: [{ movie: {...}, experienceSessions: [...], shows: [...] }]).
    const film = (o.movie && typeof o.movie === 'object' ? o.movie : o) as Json;
    const title = text(film.title) || text(film.name) || text(film.movieName);

    // A movie is a title with a list of sessions/shows.
    if (title && (o.experienceSessions || o.shows)) {
      const movie = byTitle.get(title) ?? {
        title,
        certification: text(film.certification) || text(film.rating),
        runTime: text(film.runTimeStr),
        experiences: [],
        showtimes: [],
        screens: [],
      };
      collectShows(o.experienceSessions ?? o.shows, movie, '');
      byTitle.set(title, movie);
      return;
    }
    // Not a movie: keep looking inside it.
    Object.values(o).forEach(visit);
  };

  // Step 2: inside a movie, collect every show with its experience and screen.
  const collectShows = (node: unknown, movie: MovieShowing, experience: string) => {
    if (Array.isArray(node)) return node.forEach((n) => collectShows(n, movie, experience));
    if (!node || typeof node !== 'object') return;
    const o = node as Json;
    // Remember the experience (VIP, IMAX, ...) for the shows below it.
    const exp = text(o.experience) || experience;
    if (exp && !movie.experiences.includes(exp)) movie.experiences.push(exp);

    // A show has a start time; add it (and its screen) once.
    if (o.showTime !== undefined) {
      const time = [text(o.sessionBusinessDateStr), text(o.showTime)].filter(Boolean).join(' ');
      if (time && !movie.showtimes.includes(time)) movie.showtimes.push(time);
      const screen = text(o.screenName);
      if (screen && !movie.screens.includes(screen)) movie.screens.push(screen);
    }
    Object.values(o).forEach((v) => collectShows(v, movie, exp));
  };

  visit(output);
  return [...byTitle.values()];
}
