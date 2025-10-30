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
	tables: Record<string, any>;
}
