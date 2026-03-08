import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, Easing, Dimensions } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import useTheme from '../hooks/useTheme'

const { height } = Dimensions.get('window')

/**
 * Wave path data (seamless sine curve, 2 cycles)
 * 0-300 is one cycle, 300-600 is second cycle.
 * Tangents match at 0, 300, 600 for perfect tiling.
 */
const WAVE_PATH = `M 0 50 C 80 20 220 80 300 50 C 380 20 520 80 600 50 L 600 150 L 0 150 Z`

interface Props {
    progress: number // 0 to 1
    message?: string
}

export default function WaveLoading({ progress, message = 'Importing...' }: Props) {
    const { loadingStyle } = useTheme();

    // Animation of the wave moving horizontally
    const translateX1 = useRef(new Animated.Value(0)).current
    const fillHeight = useRef(new Animated.Value(0)).current

    // Loop the waves horizontally
    useEffect(() => {
        Animated.loop(
            Animated.timing(translateX1, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start()
    }, [])

    // Animate vertical fill based on progress prop
    useEffect(() => {
        Animated.timing(fillHeight, {
            toValue: progress,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start()
    }, [progress])

    // Interpolate translate X for waves (shift by 600px = 1 period of 300 units stretched 2x)
    const wave1X = translateX1.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -600],
    })

    // Interpolate fill height to screen position
    const waterLevel = fillHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [height - 50, -50],
    })

    return (
        <View style={loadingStyle.container}>
            <View style={loadingStyle.background} />

            <Animated.View
                style={[
                    loadingStyle.waveContainer,
                    { transform: [{ translateY: waterLevel }] },
                ]}
            >
                {/* Single Wave (Restored) */}
                <Animated.View
                    style={{
                        width: 1200,
                        height: 150,
                        transform: [{ translateX: wave1X }],
                        marginBottom: -10 // Overlap to prevent thin lines
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

                {/* Solid Water Block */}
                <View style={loadingStyle.solidWater} />
            </Animated.View>

            <View style={loadingStyle.textContainer}>
                <Text style={loadingStyle.percentage}>{(Math.min(progress, 1) * 100).toFixed(0)}%</Text>
                <Text style={loadingStyle.message}>{message}</Text>
            </View>
        </View>
    )
}
