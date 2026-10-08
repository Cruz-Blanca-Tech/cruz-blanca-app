/**
 * Utilidad para la separación inteligente de nombres y apellidos del beneficiario
 * basada en la coherencia genealógica (apellidos de padre y madre según la ley peruana).
 */

export function normalizeNameToken(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[0-9]+/g, ' ')
    .replace(/[^A-Z\s]/g, ' ')
    .trim();
}

export function getPersonSurnames(fullName: string | null | undefined): string[] {
  if (!fullName) return [];
  const clean = normalizeNameToken(fullName);
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  if (tokens.length === 1) return tokens;
  if (tokens.length === 2) return [tokens[1]];
  if (tokens.length === 3) return [tokens[1], tokens[2]];
  return [tokens[tokens.length - 2], tokens[tokens.length - 1]];
}

export function getPrimaryPaternalSurname(fullName: string | null | undefined): string | null {
  if (!fullName) return null;
  const clean = normalizeNameToken(fullName);
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  if (tokens.length === 1) return tokens[0];
  if (tokens.length <= 3) return tokens[1];
  return tokens[tokens.length - 2];
}

export function isNoiseText(text: string): boolean {
  if (!text) return true;
  const t = text.trim();
  if (t.length <= 3 && !/^[a-zA-Z]+$/.test(t)) return true;
  if (t.endsWith('.') && t.length <= 4) return true;
  const lower = t.toLowerCase();
  return ['null', 'none', 'bir.', 'bir', 's/n', 's/d', '-', '--'].includes(lower);
}

export function separateChildNameAndSurnames(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fatherFullName?: string | null,
  motherFullName?: string | null
): { firstName: string; lastName: string } {
  const rawFn = (firstName || '').replace(/[0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const rawLn = (lastName || '').replace(/[0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (!rawFn) {
    return { firstName: rawFn, lastName: rawLn };
  }

  const fatherSurnames = getPersonSurnames(fatherFullName);
  const motherSurnames = getPersonSurnames(motherFullName);
  const fatherPaternal = getPrimaryPaternalSurname(fatherFullName);
  const motherPaternal = getPrimaryPaternalSurname(motherFullName);

  const allParentSurnames = Array.from(new Set([...fatherSurnames, ...motherSurnames]));
  if (!allParentSurnames.length) {
    return { firstName: rawFn, lastName: rawLn };
  }

  const fnTokens = rawFn.split(/\s+/).filter(Boolean);
  if (fnTokens.length <= 1) {
    const lastTok = fnTokens[0];
    const normTok = normalizeNameToken(lastTok);
    for (const s of allParentSurnames) {
      if (s.length >= 4) {
        for (let i = s.length; i >= 4; i--) {
          const sub = s.slice(0, i);
          if (normTok.endsWith(sub) && normTok.length > sub.length + 2) {
            const base = lastTok.slice(0, normTok.length - sub.length);
            return { firstName: base, lastName: rawLn || s };
          }
        }
      }
    }
    return { firstName: rawFn, lastName: rawLn };
  }

  const surnamesInFn: string[] = [];
  const namesInFn = [...fnTokens];

  while (namesInFn.length > 1) {
    const lastTok = namesInFn[namesInFn.length - 1];
    const normTok = normalizeNameToken(lastTok);

    let isMatch = allParentSurnames.includes(normTok);
    let matchedSurname: string | null = isMatch ? normTok : null;

    if (!isMatch) {
      for (const s of allParentSurnames) {
        if (s.length >= 4) {
          if (normTok.startsWith(s) || normTok.endsWith(s)) {
            isMatch = true;
            matchedSurname = s;
            break;
          }
          for (let i = s.length; i >= 4; i--) {
            const sub = s.slice(0, i);
            if (normTok.endsWith(sub) && normTok.length > sub.length + 2) {
              isMatch = true;
              matchedSurname = s;
              namesInFn[namesInFn.length - 1] = lastTok.slice(0, normTok.length - sub.length);
              break;
            }
          }
          if (isMatch) break;
        }
      }
    }

    if (isMatch) {
      if (namesInFn[namesInFn.length - 1] === lastTok) {
        surnamesInFn.unshift(namesInFn.pop()!);
      } else {
        surnamesInFn.unshift(matchedSurname || lastTok);
        break;
      }
    } else {
      break;
    }
  }

  if (!surnamesInFn.length) {
    return { firstName: rawFn, lastName: rawLn };
  }

  const newFn = namesInFn.join(' ');

  let cleanExistingLn = rawLn.replace(/[.,;]+$/, '').trim();
  let normExistingLn = normalizeNameToken(cleanExistingLn).split(/\s+/).filter(Boolean);

  if (
    isNoiseText(cleanExistingLn) ||
    (normExistingLn.length === 1 &&
      normExistingLn[0].length <= 3 &&
      !allParentSurnames.includes(normExistingLn[0]))
  ) {
    cleanExistingLn = '';
    normExistingLn = [];
  }

  const surnamesToAdd: string[] = [];
  for (const s of surnamesInFn) {
    const normS = normalizeNameToken(s);
    const alreadyPresent = normExistingLn.some(
      (el) => normS === el || normS.includes(el) || el.includes(normS)
    );
    if (!alreadyPresent) {
      surnamesToAdd.push(s);
    }
  }

  if (!surnamesToAdd.length && cleanExistingLn) {
    return { firstName: newFn, lastName: cleanExistingLn };
  }

  let newLn = '';
  if (!cleanExistingLn) {
    const fatherMatched = surnamesToAdd.filter((s) =>
      fatherSurnames.includes(normalizeNameToken(s))
    );
    const motherMatched = surnamesToAdd.filter((s) =>
      motherSurnames.includes(normalizeNameToken(s))
    );

    const finalParts: string[] = [];
    if (fatherMatched.length) {
      finalParts.push(...fatherMatched);
    } else if (fatherPaternal) {
      finalParts.push(fatherPaternal);
    }

    if (motherMatched.length) {
      finalParts.push(...motherMatched);
    } else if (motherPaternal && !finalParts.includes(motherPaternal)) {
      finalParts.push(motherPaternal);
    }

    newLn = finalParts.length ? finalParts.join(' ') : surnamesToAdd.join(' ');
  } else {
    const fatherMatched = surnamesToAdd.filter((s) =>
      fatherSurnames.includes(normalizeNameToken(s))
    );
    const motherMatched = surnamesToAdd.filter((s) =>
      motherSurnames.includes(normalizeNameToken(s))
    );
    const existingIsMother = normExistingLn.some((el) => motherSurnames.includes(el));
    const existingIsFather = normExistingLn.some((el) => fatherSurnames.includes(el));

    if (existingIsMother && fatherMatched.length) {
      newLn = [...fatherMatched, cleanExistingLn].join(' ');
    } else if (existingIsFather && motherMatched.length) {
      newLn = [cleanExistingLn, ...motherMatched].join(' ');
    } else {
      if (fatherMatched.length) {
        newLn = [...fatherMatched, cleanExistingLn].join(' ');
      } else {
        newLn = [cleanExistingLn, ...surnamesToAdd].join(' ');
      }
    }
  }

  return { firstName: newFn, lastName: newLn };
}
