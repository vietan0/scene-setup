export type EntityType =
	| 'LINE'
	| 'LWPOLYLINE'
	| 'CIRCLE'
	| 'ARC'
	| 'SOLID'
	| 'INSERT'
	| 'ATTRIB'
	| 'ATTDEF'
	| 'TEXT'
	| 'MTEXT'
	| 'HATCH'
	| 'DIMENSION'
	| 'LEADER'
	| 'VIEWPORT'
	| 'WIPEOUT';

export type Entity = {
	handle: string;
	layer: string;
	name: string;
	type: EntityType;
	[key: string]: any;
};

export interface DXF {
	entities: Entity[];
	blocks: Record<string, any>;
	headers: Record<string, any>;
	objects: Record<string, any>;
	tables: {
		LAYER: {
			entries: LAYER[];
			name: 'LAYER';
			ownerObjectId: string;
			subclassMarker: string;
			handle: string;
			maxNumberOfEntries: number;
		};
		VPORT: {
			entries: VPORT[];
			handle: string;
			maxNumberOfEntries: number;
			name: 'VPORT';
			ownerObjectId: string;
			subclassMarker: string;
		};
	};
}

type LAYER = {
	colorIndex: number;
	handle: string;
	lineType: string;
	lineweight: number;
	name: string;
	ownerObjectId: string;
	plotStyleNameObjectId: string;
	standardFlag: number;
	subclassMarker: string;
};

type VPORT = {
	center: Coor2D;
	gridSpacing: Coor2D;
	handle: string;
	lowerLeftCorner: Coor2D;
	name: string;
	ownerObjectId: string;
	snapBasePoint: Coor2D;
	snapSpacing: Coor2D;
	standardFlag: number;
	subclassMarker: string;
	upperRightCorner: Coor2D;
	viewDirectionFromTarget: Coor3D;
	viewTarget: Coor3D;
};

type Coor2D = { x: number; y: number };
type Coor3D = { x: number; y: number; z: number };
