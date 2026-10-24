// scene_logic.js
class SceneManager {
    constructor() {
        this.objects = [];
    }

    spawnObject(name, role, x, y, z, color = [0.0, 0.45, 0.85, 0.65], scale = [1, 1, 1]) {
        const obj = {
            name: name,
            role: role, // 'character', 'prop', etc.
            pos: [x, y, z],
            rot: [0, 0, 0], // Degrees
            scale: scale,
            color: color,
            matrix: new Float32Array(16) // Corrected from newFloat32Array
        };
        this.objects.push(obj);
        return obj;
    }

    update(dt) {
        this.objects.forEach(obj => {
            // Convert rotation degrees to radians for matrix math
            const rx = obj.rot[0] * (Math.PI / 180);
            const ry = obj.rot[1] * (Math.PI / 180);
            const rz = obj.rot[2] * (Math.PI / 180);

            obj.matrix = this.createSRTMatrix(obj.pos, [rx, ry, rz], obj.scale);
        });
    }

    createSRTMatrix(pos, rot, scale) {
        const [x, y, z] = pos;
        const [rx, ry, rz] = rot;
        const [sx, sy, sz] = scale;

        const cx = Math.cos(rx), sx_ = Math.sin(rx);
        const cy = Math.cos(ry), sy_ = Math.sin(ry);
        const cz = Math.cos(rz), sz_ = Math.sin(rz);

        const m00 = cy * cz;
        const m01 = cy * sz_;
        const m02 = -sy_;
        const m10 = sx_ * sy_ * cz - cx * sz_;
        const m11 = sx_ * sy_ * sz_ + cx * cz;
        const m12 = sx_ * cy;
        const m20 = cx * sy_ * cz + sx_ * sz_;
        const m21 = cx * sy_ * sz_ - sx_ * cz;
        const m22 = cx * cy;

        return new Float32Array([
            m00 * sx, m01 * sx, m02 * sx, 0,
            m10 * sy, m11 * sy, m12 * sy, 0,
            m20 * sz, m21 * sz, m22 * sz, 0,
            x,        y,        z,        1
        ]);
    }
}
