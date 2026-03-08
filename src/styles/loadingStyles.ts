import { StyleSheet, Dimensions } from 'react-native';
import { getThemeColors, FONT_SIZE, FONT_WEIGHT } from './theme';

const { height } = Dimensions.get('window');

export const loadingStyles = (scheme: any) => {
    // WaveLoading doesn't rely deeply on theme colors for the wave itself (hardcoded/prop driven usually), 
    // but message text might.
    // However, WaveLoading implementation is very custom. 
    // We'll wrap the stylesheet creation.

    return StyleSheet.create({
        container: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'transparent',
            zIndex: 9999,
            overflow: 'hidden',
        },
        background: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: '#f0f0f0', // Could use schemeColors.background?
        },
        waveContainer: {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: height + 150,
        },
        solidWater: {
            height: height,
            backgroundColor: '#00f2fe',
        },
        textContainer: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center',
        },
        percentage: {
            fontSize: 48,
            fontWeight: '900',
            color: '#005f7f',
            opacity: 0.8,
        },
        message: {
            marginTop: 8,
            fontSize: 18,
            color: '#005f7f',
            fontWeight: '600',
        },
    });
};
