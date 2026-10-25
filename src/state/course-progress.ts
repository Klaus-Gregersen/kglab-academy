import type { ShortCourse } from '../courses/short-courses';
import type { StorageLike } from './progress';
export type CourseProgress = { version: 1; current: number; completed: string[] };
export const courseKey = (id: string) => `kglab:course:${id}:v1`;
export function loadCourseProgress(course: ShortCourse, storage?: StorageLike): CourseProgress {
  const fresh: CourseProgress = { version: 1, current: 0, completed: [] };
  try {
    const raw = storage?.getItem(courseKey(course.id));
    if (!raw || raw.length > 8000) return fresh;
    const value = JSON.parse(raw) as CourseProgress;
    if (
      value.version !== 1 ||
      !Number.isInteger(value.current) ||
      value.current < 0 ||
      value.current >= course.lessons.length ||
      !Array.isArray(value.completed) ||
      value.completed.length > course.lessons.length ||
      new Set(value.completed).size !== value.completed.length ||
      value.completed.some((id) => !course.lessons.some((lesson) => lesson.id === id))
    )
      return fresh;
    return value;
  } catch {
    return fresh;
  }
}
export function saveCourseProgress(
  course: ShortCourse,
  value: CourseProgress,
  storage?: StorageLike,
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(courseKey(course.id), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
