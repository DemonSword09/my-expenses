import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

const SkeletonItem = ({ schemeColors }: { schemeColors: any }) => {
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
        <View style={[styles.itemRow, { borderBottomColor: schemeColors.border }]}>
            <View style={styles.dateCol}>
                <Animated.View style={[styles.skeletonBox, { width: 40, height: 14, backgroundColor: baseColor, opacity, marginBottom: 4 }]} />
                <Animated.View style={[styles.skeletonBox, { width: 30, height: 12, backgroundColor: baseColor, opacity }]} />
            </View>
            <View style={styles.detailsCol}>
                <Animated.View style={[styles.skeletonBox, { width: '70%', height: 16, backgroundColor: baseColor, opacity, marginBottom: 6 }]} />
                <Animated.View style={[styles.skeletonBox, { width: '40%', height: 14, backgroundColor: baseColor, opacity }]} />
            </View>
            <View style={styles.statusCol}>
                <Animated.View style={[styles.skeletonBox, { width: 20, height: 20, borderRadius: 10, backgroundColor: baseColor, opacity }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    itemRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    dateCol: {
        width: 60,
        alignItems: 'center',
    },
    detailsCol: {
        flex: 1,
        paddingHorizontal: 12,
    },
    statusCol: {
        width: 40,
        alignItems: 'center',
    },
    skeletonBox: {
        borderRadius: 4,
    },
});

export default SkeletonItem;
