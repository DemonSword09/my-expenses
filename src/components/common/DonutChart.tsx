import React from 'react';
import { View, StyleSheet, Text, Pressable, GestureResponderEvent } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withSpring } from 'react-native-reanimated';

// Reanimated SVG Path
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface DonutChartProps {
    data: {
        id: string;
        name: string;
        amount: number;
        color: string;
        percentage: number;
    }[];
    radius: number;
    innerRadius: number;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    schemeColors: any;
}

// Helper: Polar to Cartesian
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInRadians: number) {
    'worklet';
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

// Helper: Describe Arc
function describeArc(x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
    'worklet';
    const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

    return [
        "M", startOuter.x, startOuter.y,
        "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        "L", endInner.x, endInner.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
        "Z"
    ].join(" ");
}

const Slice = ({
    item,
    startAngle,
    endAngle,
    radius,
    innerRadius,
    isSelected,
}: any) => {
    // Animation state: extra radius
    const expansion = useSharedValue(0);

    // React to selection
    React.useEffect(() => {
        // Expand outer by 6 units
        expansion.value = withSpring(isSelected ? 6 : 0, { damping: 15, stiffness: 100 });
    }, [isSelected]);

    // We rotate -90 deg (PI/2) to start at 12 o'clock
    const shift = -Math.PI / 2;

    const animatedProps = useAnimatedProps(() => {
        // Calculate dynamic path based on expansion
        const currentOuterRadius = radius + expansion.value;
        const currentInnerRadius = innerRadius; // Keep inner radius constant

        const path = describeArc(0, 0, currentInnerRadius, currentOuterRadius, startAngle + shift, endAngle + shift);
        return {
            d: path
        };
    });

    return (
        <G>
            <AnimatedPath
                fill={item.color}
                animatedProps={animatedProps}
                stroke={"transparent"}
                strokeWidth={2} // Small stroke just for anti-aliasing overlap, not hit detection anymore
            />
        </G>
    );
};

export const DonutChart = ({ data, radius, innerRadius, selectedId, onSelect, schemeColors }: DonutChartProps) => {
    const size = radius * 2 + 50; // Extra padding for expansion
    const center = size / 2;

    // Calculate angles
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    let currentAngle = 0;
    const slices = data.map((item) => {
        const sweep = (item.amount / total) * Math.PI * 2;
        const start = currentAngle;
        const end = currentAngle + sweep;
        currentAngle = end;
        return { ...item, start, end };
    });

    // Sort slices so selected item is rendered last (on top)
    const sortedSlices = React.useMemo(() => {
        return [...slices].sort((a, b) => {
            if (a.id === selectedId) return 1;
            if (b.id === selectedId) return -1;
            return 0;
        });
    }, [slices, selectedId]);

    // Center Info logic
    const selectedItem = data.find(d => d.id === selectedId);

    // Display Logic: If selection, show Item info. Else show "Total"
    const centerLabel = selectedItem ? selectedItem.name : "Total";
    const centerPercent = selectedItem ? `${selectedItem.percentage.toFixed(1)}%` : null;

    const handlePress = (e: GestureResponderEvent) => {
        const { locationX, locationY } = e.nativeEvent;

        // Calculate distance from center
        const dx = locationX - center;
        const dy = locationY - center;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Hit test: Check if click is within the donut ring (with buffer)
        // Buffer: +15px outside, matches the visual expansion
        if (distance < innerRadius || distance > radius + 15) {
            // Clicked hole or outside
            onSelect(null);
            return;
        }

        // Calculate angle
        // Math.atan2 returns -PI to PI. 0 is 3 o'clock (positive X axis).
        // Our chart starts at 12 o'clock (-PI/2).
        let angle = Math.atan2(dy, dx);

        // Normalize angle to [0, 2PI] relative to -PI/2 start
        // 1. Shift by +PI/2 to align 12 o'clock to 0
        angle += Math.PI / 2;

        // 2. Normalize to [0, 2PI]
        if (angle < 0) {
            angle += 2 * Math.PI;
        }

        // Find slice
        const clickedSlice = slices.find(s => angle >= s.start && angle < s.end);

        if (clickedSlice) {
            onSelect(selectedId === clickedSlice.id ? null : clickedSlice.id);
        } else {
            onSelect(null);
        }
    };

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Pressable onPress={handlePress} style={StyleSheet.absoluteFill}>
                <View style={{ width: size, height: size }} pointerEvents="none">
                    <Svg width={size} height={size} viewBox={`${-center} ${-center} ${size} ${size}`}>
                        <G>
                            {sortedSlices.map((slice) => (
                                <Slice
                                    key={slice.id}
                                    item={slice}
                                    startAngle={slice.start}
                                    endAngle={slice.end}
                                    radius={radius}
                                    innerRadius={innerRadius}
                                    isSelected={selectedId === slice.id}
                                />
                            ))}
                        </G>
                    </Svg>
                </View>
            </Pressable>

            {/* Center Overlay */}
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
                <View style={{ alignItems: 'center', width: innerRadius * 1.6 }}>
                    <Text style={{ color: schemeColors.muted, fontSize: 13, marginBottom: 4, textAlign: 'center' }} numberOfLines={1}>
                        {centerLabel}
                    </Text>
                    <Text style={{ color: schemeColors.text, fontSize: 20, fontWeight: 'bold' }}>
                        {centerPercent || '100%'}
                    </Text>
                </View>
            </View>
        </View>
    );
};
