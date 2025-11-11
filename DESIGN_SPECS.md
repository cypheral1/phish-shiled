# 🎨 Phishing Shield - Design Specifications

## Visual Identity

### Color Palette

#### Primary Colors
| Color | Hex | RGB | Use Case |
|-------|-----|-----|----------|
| Purple | #7c3aed | rgb(124, 58, 237) | Main accent, buttons, titles |
| Cyan | #06b6d4 | rgb(6, 182, 212) | Secondary accent, highlights |
| Green | #10b981 | rgb(16, 185, 129) | Success, tertiary accents |

#### Background Colors
| Color | Hex | RGB | Use Case |
|-------|-----|-----|----------|
| Deep Blue | #0f172a | rgb(15, 23, 42) | Main background |
| Dark Blue | #0a0e27 | rgb(10, 14, 39) | Darker backgrounds |
| Navy | #1e1b4b | rgb(30, 27, 75) | Container backgrounds |

#### Alert Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Red | #ef4444 | Critical threats |
| Orange | #f59e0b | Warnings |
| Green | #10b981 | Safe/Success |

### Typography

#### Font Family
- **Primary**: 'Poppins', 'Inter', sans-serif
- **Fallback**: System font stack

#### Font Sizes
| Element | Size | Weight | Line Height |
|---------|------|--------|------------|
| Hero Title | 4.5rem | 800 | 1.1 |
| Section Title | 3rem | 800 | 1.2 |
| Card Title | 1.3rem | 600 | 1.4 |
| Body Text | 1rem | 400 | 1.6 |
| Small Text | 0.875rem | 500 | 1.5 |
| Label | 0.75rem | 700 | 1 |

### Spacing System

```css
Base Unit: 8px

Spacing Scale:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px
- 4xl: 96px
```

### Border Radius

```css
- Small: 6px
- Medium: 8px
- Large: 12px
- X-Large: 16px
- Circle: 50%
```

### Shadows

#### Card Shadows
```css
/* Light Shadow */
box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

/* Medium Shadow */
box-shadow: 0 10px 40px rgba(124, 58, 237, 0.3);

/* Deep Shadow */
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);

/* Glow Shadow */
box-shadow: 0 0 20px rgba(124, 58, 237, 0.3);
```

### Effects

#### Glassmorphism
```css
backdrop-filter: blur(20px);
background: rgba(15, 23, 42, 0.7);
border: 1px solid rgba(124, 58, 237, 0.2);
box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

#### Gradients
```css
/* Purple to Cyan */
background: linear-gradient(135deg, #7c3aed, #06b6d4);

/* Background Gradient */
background: linear-gradient(
    135deg,
    var(--dark) 0%,
    rgba(124, 58, 237, 0.1) 25%,
    rgba(6, 182, 212, 0.1) 50%,
    rgba(16, 185, 129, 0.1) 75%,
    var(--dark) 100%
);
```

## Layout Specifications

### Container
```css
max-width: 1400px;
padding: 0 40px;
margin: 0 auto;
```

### Section Spacing
```css
padding: 100px 40px;
margin-top: 100px;
```

### Grid Systems

#### Features Grid
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 30px;
```

#### Hero Content
```css
display: flex;
flex-direction: column;
align-items: center;
gap: 60px;
```

## Component Specifications

### Risk Score Card

#### Dimensions
- Width: 500px (max)
- Padding: 50px 40px
- Border Radius: 20px

#### Circular Progress
- Size: 200x200px
- Stroke Width: 8px
- Animate to: 82% (438px offset)

#### Progress Bars
- Height: 6px
- Border Radius: 3px
- Stroke Width: 1px

### Feature Cards

#### Dimensions
- Min Width: 300px
- Padding: 40px 30px
- Border Radius: 16px

#### Hover State
- Transform: translateY(-10px)
- Box-shadow: 0 20px 60px rgba(124, 58, 237, 0.2)
- Border Color: var(--primary)

### Buttons

#### Primary Button
```css
padding: 16px 40px;
border-radius: 10px;
background: linear-gradient(135deg, var(--primary), var(--secondary));
box-shadow: 0 10px 40px rgba(124, 58, 237, 0.3);
transition: all 0.3s ease;
```

#### Button States
| State | Transform | Shadow |
|-------|-----------|--------|
| Default | none | 0 10px 40px rgba(...) |
| Hover | translateY(-4px) | 0 15px 60px rgba(...) |
| Active | translateY(-2px) | 0 10px 40px rgba(...) |

## Animation Specifications

### Timing Functions
```css
ease: ease
ease-in: ease-in
ease-out: ease-out
ease-in-out: ease-in-out
cubic-bezier: cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

### Animation Durations
| Animation | Duration | Timing |
|-----------|----------|--------|
| Entrance | 0.8s | ease |
| Hover | 0.3s | ease |
| Scroll | 8s-20s | linear/ease |
| Progress | 1.5s-2s | ease-out |
| Continuous | 6s-15s | infinite |

### Key Animations

#### Slide In Down
```css
@keyframes slideInDown {
    from {
        opacity: 0;
        transform: translateY(-30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

#### Slide In Up
```css
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

#### Fill Progress
```css
@keyframes fillProgress {
    from { stroke-dashoffset: 534; }
    to { stroke-dashoffset: 96; }
}
```

#### Glow Pulse
```css
@keyframes glowPulse {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
}
```

## Responsive Design

### Breakpoints
```css
Desktop: > 768px
Tablet: 768px - 480px
Mobile: < 480px
```

### Typography Adjustments

#### Desktop
- Hero Title: 4.5rem
- Section Title: 3rem

#### Tablet
- Hero Title: 2.5rem
- Section Title: 2rem

#### Mobile
- Hero Title: 1.8rem
- Section Title: 1.5rem

### Layout Adjustments

#### Desktop
- Navigation visible
- 3-column grids
- Full spacing (40px)
- All animations enabled

#### Tablet
- Navigation visible
- 2-column grids
- Adjusted spacing (30px)
- Simplified animations

#### Mobile
- Navigation hidden
- Single column
- Reduced spacing (20px)
- Essential animations only

## Accessibility

### Contrast Ratios
| Text on Background | Ratio | WCAG |
|-------------------|-------|------|
| White on Dark Blue | 14.8:1 | AAA |
| Cyan on Dark Blue | 4.5:1 | AA |
| Purple on Dark Blue | 7.2:1 | AAA |

### Focus States
```css
outline: 2px solid var(--secondary);
outline-offset: 2px;
```

### Alt Text
All images and icons have descriptive alt text for screen readers.

### Keyboard Navigation
- Tab key: Navigate through interactive elements
- Enter: Activate buttons/links
- Escape: Close overlays
- Ctrl+Enter: Navigate to detector

## Browser-Specific Notes

### Chrome/Edge
- Full support for all features
- Optimal performance

### Firefox
- Full support
- May need vendor prefixes for older versions

### Safari
- Requires -webkit prefixes for:
  - background-clip
  - text-fill-color
  - backdrop-filter

### Mobile Browsers
- Touch-friendly button sizes (min 44x44px)
- Optimized for viewport sizes

## Performance Targets

- **First Contentful Paint**: < 1s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Lighthouse Score**: > 90

## File Sizes (Optimized)

| File | Size |
|------|------|
| hero.html | ~15 KB |
| hero-style.css | ~35 KB |
| hero-script.js | ~12 KB |
| Total | ~62 KB |

## Future Design Considerations

- [ ] Dark/Light theme toggle
- [ ] Animated SVG illustrations
- [ ] Video backgrounds
- [ ] 3D WebGL effects
- [ ] Micro-interactions library
- [ ] Custom font loading
- [ ] Progressive enhancement
- [ ] Accessibility improvements

---

**Design System Version**: 1.0  
**Last Updated**: November 2024  
**Maintained by**: Cicada Tech
