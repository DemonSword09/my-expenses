import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CategoryImages } from '../../utils/categoryImages';
import useTheme from '../../hooks/useTheme';

interface CategoryIconProps {
  categoryLabel?: string | null;
  parentLabel?: string | null;
  categoryIcon?: string | null;
  size?: number;
  color?: string;
  fallbackTextColor?: string;
  containerStyle?: any;
}

function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[a.length][b.length];
}

function findBestImageMatch(categoryLabel?: string | null, parentLabel?: string | null) {
  if (!categoryLabel) return null;
  const keys = Object.keys(CategoryImages);
  
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cat = norm(categoryLabel);
  const parent = parentLabel ? norm(parentLabel) : '';
  const full1 = parent + cat;
  const full2 = cat + parent;

  // 1. Exact match checking
  let match = keys.find(k => {
    const nk = norm(k);
    return nk === cat || nk === full1 || nk === full2;
  });
  if (match) return CategoryImages[match];

  // 2. Singular/ plural
  match = keys.find(k => {
    const nk = norm(k).replace(/s$/, '');
    return nk === cat.replace(/s$/, '') || 
           nk === full1.replace(/s$/, '') || 
           nk === full2.replace(/s$/, '');
  });
  if (match) return CategoryImages[match];

  // 3. Substring match
  match = keys.find(k => {
    const nk = norm(k);
    // Be very strict: Only match if length is decent and it's a prefix/suffix
    if (nk.length > 4 && cat.length > 4 && (nk.startsWith(cat) || cat.startsWith(nk) || nk.endsWith(cat) || cat.endsWith(nk))) return true;
    if (parent && nk.length > 5 && (nk.startsWith(full1) || full1.startsWith(nk))) return true;
    return false;
  });
  if (match) return CategoryImages[match];

  // 4. Distance match for typos (ONLY if word is long enough, to avoid random matches for short words)
  if (cat.length >= 5) {
    let bestMatch = null;
    let bestScore = 3; // Max threshold differences
    for (const k of keys) {
      const nk = norm(k);
      // Ensure the lengths are very similar
      if (Math.abs(nk.length - cat.length) > 2) continue;
      
      const dist = getLevenshteinDistance(nk, cat);
      // Require the distance to be proportionally small
      if (dist < bestScore && dist <= Math.ceil(cat.length * 0.3)) {
        bestScore = dist;
        bestMatch = k;
      }
    }
    if (bestMatch) return CategoryImages[bestMatch];
  }

  return null;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryLabel,
  parentLabel,
  categoryIcon,
  size = 24,
  color,
  fallbackTextColor,
  containerStyle,
}) => {
  const { schemeColors } = useTheme();

  const iconColor = color || schemeColors.primary;
  const textColor = fallbackTextColor || schemeColors.text;

  const mappedImageSource = useMemo(() => {
    // Skip expensive fuzzy finding if an explicit custom image URI is already provided
    if (categoryIcon && (categoryIcon.startsWith('file://') || categoryIcon.startsWith('http://') || categoryIcon.startsWith('https://'))) {
        return null;
    }
    return findBestImageMatch(categoryLabel, parentLabel);
  }, [categoryLabel, parentLabel, categoryIcon]);

  // 1. Check if categoryIcon is a local file URI or web URL (from custom image picker/input)
  if (categoryIcon && (categoryIcon.startsWith('file://') || categoryIcon.startsWith('http://') || categoryIcon.startsWith('https://'))) {
    return (
      <View style={[styles.container, { width: size, height: size }, containerStyle]}>
        <Image
          source={{ uri: categoryIcon }}
          style={{ width: size, height: size, borderRadius: size / 2 }} // optionally circular
          resizeMode="cover"
        />
      </View>
    );
  }

  // 2. Return Mapped Image
  if (mappedImageSource) {
    return (
      <View style={[styles.container, { width: size, height: size }, containerStyle]}>
        <Image
          source={mappedImageSource}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // 3. Fallback to Material Community Icon
  if (categoryIcon) {
    return (
      <View style={[styles.container, { width: size, height: size }, containerStyle]}>
        <MaterialCommunityIcons
          name={categoryIcon as any}
          size={size}
          color={iconColor}
        />
      </View>
    );
  }

  // 4. Fallback to First Character
  const firstChar = categoryLabel ? categoryLabel.charAt(0).toUpperCase() : 'C';
  const fontSize = Math.max(12, Math.floor(size * 0.6));

  return (
    <View style={[styles.container, { width: size, height: size }, containerStyle]}>
      <Text style={[styles.fallbackText, { color: textColor, fontSize, lineHeight: size }]}>
        {firstChar}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallbackText: {
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
