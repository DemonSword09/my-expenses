import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import useTheme from '../../hooks/useTheme';

const SkeletonItem = ({ schemeColors }: { schemeColors: any }) => {
    const { recurrenceStyle } = useTheme();
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 100,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 100,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    const baseColor = schemeColors.border; // Use border color as base for skeleton

    return (
        <View style={[recurrenceStyle.itemRow, { borderBottomColor: schemeColors.border }]}>
            <View style={recurrenceStyle.dateCol}>
                <Animated.View style={[recurrenceStyle.skeletonBox, { width: 40, height: 14, backgroundColor: baseColor, opacity, marginBottom: 4 }]} />
                <Animated.View style={[recurrenceStyle.skeletonBox, { width: 30, height: 12, backgroundColor: baseColor, opacity }]} />
            </View>
            <View style={recurrenceStyle.detailsCol}>
                <Animated.View style={[recurrenceStyle.skeletonBox, { width: '70%', height: 16, backgroundColor: baseColor, opacity, marginBottom: 6 }]} />
                <Animated.View style={[recurrenceStyle.skeletonBox, { width: '40%', height: 14, backgroundColor: baseColor, opacity }]} />
            </View>
            <View style={recurrenceStyle.statusCol}>
                <Animated.View style={[recurrenceStyle.skeletonBox, { width: 20, height: 20, borderRadius: 10, backgroundColor: baseColor, opacity }]} />
            </View>
        </View>
    );
};

export default SkeletonItem;
