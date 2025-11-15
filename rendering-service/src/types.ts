export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'stat' | 'rectangle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex: number;
  visible: boolean;
}

export interface TextElement extends TemplateElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface ImageElement extends TemplateElement {
  type: 'image';
  src: string;
  objectFit: 'cover' | 'contain' | 'fill';
}

export interface StatElement extends TemplateElement {
  type: 'stat';
  statKey: string;
  label?: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
}

export interface CardLayout {
  width: number;
  height: number;
  backgroundColor?: string;
  backgroundImage?: string;
  elements: TemplateElement[];
}

