import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'

const { width, height } = Dimensions.get('window')

/**
 * Wave path data (simple sine-like curve)
 * We scale this horizontally.
 */
const WAVE_PATH = `M 0 50 C 140 10 230 90 300 50 C 370 10 490 90 600 50 L 600 150 L 0 150 Z`

interface Props {
    progress: number // 0 to 1
    message?: string
}

export default function WaveLoading({ progress, message = 'Importing...' }: Props) {
    // Animation values
    const translateX = useRef(new Animated.Value(0)).current
    const fillHeight = useRef(new Animated.Value(0)).current

    // 1. Loop the wave horizontally (ping-pong effect)
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateX, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease), // Smooth ease for sloshing effect
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start()
    }, [])

    // 2. Animate vertical fill based on progress prop
    useEffect(() => {
        Animated.timing(fillHeight, {
            toValue: progress,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false, // height is not supported by native driver usually for layout, but here we animate translateY
        }).start()
    }, [progress])

    // Interpolate translate X to move the wave pattern
    const waveX = translateX.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -300], // Shift by one-half wave width roughly to loop
    })

    // Interpolate fill height to screen position
    // At 0%, wave starts just visible at bottom. At 100%, covers top.
    const waterLevel = fillHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [height - 50, -50],
    })

    return (
        <View style={styles.container}>
            {/* Background (empty) */}
            <View style={styles.background} />

            {/* The Wave + Water container */}
            <Animated.View
                style={[
                    styles.waveContainer,
                    {
                        transform: [{ translateY: waterLevel }],
                    },
                ]}
            >
                {/* The Wave Graphic */}
                <Animated.View
                    style={{
                        width: 1200, // wider than screen for scrolling
                        height: 150,
                        transform: [{ translateX: waveX }],
                        marginBottom: -1 // overlap to avoid gap
                    }}
                >
                    <Svg height="100%" width="100%" viewBox="0 0 600 150" preserveAspectRatio="none">
                        <Defs>
                            <LinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="#4facfe" stopOpacity="1" />
                                <Stop offset="1" stopColor="#00f2fe" stopOpacity="1" />
                            </LinearGradient>
                        </Defs>
                        <Path d={WAVE_PATH} fill="url(#waveGrad)" />
                    </Svg>
                </Animated.View>

                {/* The solid block of water below the wave */}
                <View style={styles.solidWater} />
            </Animated.View>

            {/* Centered Text Overlay */}
            <View style={styles.textContainer}>
                <Text style={styles.percentage}>{(Math.min(progress, 1) * 100).toFixed(0)}%</Text>
                <Text style={styles.message}>{message}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent', // or transparent
        zIndex: 9999,
        overflow: 'hidden',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#f0f0f0',
    },
    waveContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0, // We animate translateY to push this entire block down
        height: height + 150, // Screen height + wave height buffer
    },
    solidWater: {
        height: height, // Enough to fill screen
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
})
